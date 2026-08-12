import os
import json

from dotenv import load_dotenv
from groq import Groq


load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


def extract_query(raw_query: str) -> dict:

    prompt = f"""
Extract structured information from the user's clinical-trial search.

User query:
{raw_query}

Return ONLY valid JSON with these fields:

{{
    "condition": "string",
    "location": "string or null",
    "age": "number or null"
}}

Do not diagnose the user.
Do not add information that is not present.
"""


    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "system",
                "content": "You extract structured search information."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0,
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content

    return json.loads(content)