{context}

Return STRICT JSON matching this schema:
{{
  "folder_structure": [string],
  "apis": [{{"method": string, "path": string, "purpose": string}}],
  "models": [{{"name": string, "fields": [{{"name": string, "type": string, "constraints": string}}]}}],
  "endpoints": [{{"method": string, "path": string, "description": string}}],
  "confidence": number between 0 and 1
}}
