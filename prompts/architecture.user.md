{context}

Return STRICT JSON matching this schema:
{{
  "architecture": string,
  "database": string,
  "authentication": string,
  "services": [string],
  "apis": [{{"method": string, "path": string, "purpose": string}}],
  "deployment": [string],
  "confidence": number between 0 and 1
}}
