import os

from dotenv import load_dotenv
from groq import Groq


load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


def explain_eligibility(criteria: str) -> str:

    if not criteria:
        return "Eligibility criteria were not provided."


    prompt = f"""
You are rewriting clinical trial eligibility criteria
for a patient.

Your job is TRANSLATION, NOT MEDICAL REASONING.

Rewrite the following eligibility criteria in clear,
simple language.

STRICT RULES:

1. Do not add any eligibility requirement.
2. Do not remove an important requirement.
3. Do not infer information that is not present.
4. Do not decide whether the patient qualifies.
5. Do not provide medical advice.
6. Preserve inclusion and exclusion requirements.
7. If a medical term is unclear, keep the term and
   explain it only if its meaning is explicitly clear.
8. If something cannot safely be simplified, leave
   the original medical term.
9. Base your answer ONLY on the supplied text.

Eligibility criteria:

{criteria}
"""


    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "system",
                "content": (
                    "You rewrite clinical trial eligibility "
                    "criteria without adding information."
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0
    )


    return response.choices[0].message.content


def explain_eligibility_node(state):

    final_results = []

    for trial in state["ranked_trials"][:5]:

        criteria = trial.get("eligibility")

        explanation = explain_eligibility(
            criteria
        )

        result = {
            **trial,
            "eligibility_explanation": explanation,
        }

        final_results.append(result)

    return {
        **state,
        "final_results": final_results,
    }
