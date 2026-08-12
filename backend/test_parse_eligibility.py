from raw_functions.parse_eligibility import parse_eligibility


text = """
Inclusion Criteria:
- Age 18 to 65 years
- Diagnosis of Type 2 Diabetes
- HbA1c between 7% and 10%

Exclusion Criteria:
- Severe kidney disease
- Pregnancy
"""


result = parse_eligibility(text)

print("INCLUSION:")
for item in result["inclusion"]:
    print("-", item)

print("\nEXCLUSION:")
for item in result["exclusion"]:
    print("-", item)
