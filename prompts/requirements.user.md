{context}

Return STRICT JSON matching this schema:
{{
  "functional_requirements": [{{"id": string, "title": string, "description": string, "priority": "High"|"Medium"|"Low"}}],
  "non_functional_requirements": [{{"id": string, "title": string, "description": string, "priority": string}}],
  "user_stories": [{{"id": string, "as_a": string, "i_want": string, "so_that": string}}],
  "assumptions": [string],
  "scope": [string],
  "confidence": number between 0 and 1
}}
