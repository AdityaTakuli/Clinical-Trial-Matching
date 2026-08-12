import re


def parse_eligibility(text: str) -> dict:

    if not text:
        return {
            "inclusion": [],
            "exclusion": [],
        }

    text = text.replace("\r", "\n")

    inclusion = []
    exclusion = []

    current_section = None

    for line in text.split("\n"):

        line = line.strip()

        if not line:
            continue

        lower = line.lower()

        if "inclusion criteria" in lower:
            current_section = "inclusion"
            continue

        if "exclusion criteria" in lower:
            current_section = "exclusion"
            continue

        line = re.sub(
            r"^[\-\*\u2022\d\.\)\s]+",
            "",
            line
        ).strip()

        if not line:
            continue

        if current_section == "inclusion":
            inclusion.append(line)

        elif current_section == "exclusion":
            exclusion.append(line)

    return {
        "inclusion": inclusion,
        "exclusion": exclusion,
    }
