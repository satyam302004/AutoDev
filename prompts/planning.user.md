{context}

Return STRICT JSON matching this schema:
{{
  "sprints": [{{"id": string, "name": string, "goals": [string], "tasks": [string]}}],
  "timeline": [{{"phase": string, "duration": string}}],
  "deliverables": [string],
  "risks": [{{"risk": string, "mitigation": string}}],
  "confidence": number between 0 and 1
}}
