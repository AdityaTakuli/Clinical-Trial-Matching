import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from auth.dependencies import get_current_user
from cache.rate_limit import check_rate_limit
from chat.llm import build_system_prompt, sanitize_context, stream_reply
from database.database import SessionLocal, get_db
from database.models import ChatMessage, ChatSession, User, UserProfile
from profiles.service import profile_for_llm


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Chat"])

DEFAULT_TITLE = "New conversation"
MAX_HISTORY_MESSAGES = 20
ERROR_REPLY = "\n\n_Sorry, the assistant is temporarily unavailable. Please try again in a moment._"


class CreateSessionBody(BaseModel):
    title: str | None = Field(default=None, max_length=200)
    context: dict | None = None


class SendMessageBody(BaseModel):
    content: str = Field(min_length=1, max_length=4000)


class MessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class SessionSummary(BaseModel):
    id: int
    title: str
    query: str | None
    trial_count: int
    created_at: datetime
    updated_at: datetime


class SessionDetail(SessionSummary):
    context: dict | None
    messages: list[MessageOut]


def _summary(session: ChatSession) -> dict:
    context = session.context or {}
    return {
        "id": session.id,
        "title": session.title,
        "query": context.get("query"),
        "trial_count": len(context.get("trials") or []),
        "created_at": session.created_at,
        "updated_at": session.updated_at,
    }


def _get_owned_session(db: Session, user_id: int, session_id: int) -> ChatSession:
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == user_id)
        .first()
    )
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    return session


def _title_from_message(content: str) -> str:
    title = " ".join(content.split())
    return title if len(title) <= 60 else title[:57].rstrip() + "…"


@router.get("/sessions", response_model=list[SessionSummary])
def list_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.updated_at.desc())
        .limit(100)
        .all()
    )
    return [_summary(session) for session in sessions]


@router.post(
    "/sessions",
    response_model=SessionDetail,
    status_code=status.HTTP_201_CREATED,
)
def create_session(
    body: CreateSessionBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    title = (body.title or "").strip() or DEFAULT_TITLE
    now = datetime.utcnow()

    session = ChatSession(
        user_id=current_user.id,
        title=title,
        context=sanitize_context(body.context),
        created_at=now,
        updated_at=now,
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return {**_summary(session), "context": session.context, "messages": []}


@router.get("/sessions/{session_id}", response_model=SessionDetail)
def get_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = _get_owned_session(db, current_user.id, session_id)

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at, ChatMessage.id)
        .all()
    )

    return {**_summary(session), "context": session.context, "messages": messages}


@router.delete("/sessions/{session_id}", status_code=status.HTTP_200_OK)
def delete_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = _get_owned_session(db, current_user.id, session_id)

    db.query(ChatMessage).filter(ChatMessage.session_id == session.id).delete(
        synchronize_session=False
    )
    db.delete(session)
    db.commit()

    return {"message": "Conversation deleted"}


def _save_assistant_message(session_id: int, content: str) -> None:
    # The request-scoped session may already be closed while streaming,
    # so persist the reply with a fresh one.
    db = SessionLocal()
    try:
        db.add(ChatMessage(session_id=session_id, role="assistant", content=content))
        db.query(ChatSession).filter(ChatSession.id == session_id).update(
            {"updated_at": datetime.utcnow()}
        )
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Failed to save assistant message")
    finally:
        db.close()


@router.post("/sessions/{session_id}/messages")
def send_message(
    session_id: int,
    body: SendMessageBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    content = body.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    if not check_rate_limit(current_user.id):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Try again later.",
        )

    session = _get_owned_session(db, current_user.id, session_id)

    history = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at.desc(), ChatMessage.id.desc())
        .limit(MAX_HISTORY_MESSAGES)
        .all()
    )[::-1]

    profile = (
        db.query(UserProfile)
        .filter(UserProfile.user_id == current_user.id)
        .first()
    )

    llm_messages = [
        {
            "role": "system",
            "content": build_system_prompt(
                profile_for_llm(profile) if profile else None,
                session.context,
            ),
        },
        *({"role": m.role, "content": m.content} for m in history),
        {"role": "user", "content": content},
    ]

    db.add(ChatMessage(session_id=session.id, role="user", content=content))
    if session.title == DEFAULT_TITLE:
        session.title = _title_from_message(content)
    session.updated_at = datetime.utcnow()
    db.commit()

    saved_session_id = session.id

    def generate():
        parts: list[str] = []
        try:
            for delta in stream_reply(llm_messages):
                parts.append(delta)
                yield delta
        except Exception:
            logger.exception("Chat completion failed for session_id=%s", saved_session_id)
            yield ERROR_REPLY

        reply = "".join(parts).strip()
        if reply:
            _save_assistant_message(saved_session_id, reply)

    return StreamingResponse(
        generate(),
        media_type="text/plain; charset=utf-8",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
