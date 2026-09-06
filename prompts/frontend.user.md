{context}

Return STRICT JSON matching this schema:
{{
  "pages": [{{"name": string, "route": string, "description": string}}],
  "components": [string],
  "routes": [{{"path": string, "page": string}}],
  "state_management": string,
  "ui_layout": string,
  "confidence": number between 0 and 1
}}
