PM_SAMPLE = {
    "project_name": "Food Delivery App",
    "validated": True,
    "complexity": "Medium",
    "estimated_agents": 7,
    "execution_plan": [
        "Requirements",
        "Planner",
        "Architecture",
        "Backend",
        "Frontend",
        "QA",
        "Documentation",
    ],
    "rationale": "Standard CRUD with delivery logistics.",
    "confidence": 0.8,
}

REQUIREMENTS_SAMPLE = {
    "functional_requirements": [
        {
            "id": "FR-01",
            "title": "User registration",
            "description": "Users can create an account with email and password.",
            "priority": "High",
        }
    ],
    "non_functional_requirements": [
        {
            "id": "NFR-01",
            "title": "Performance",
            "description": "API responds within 500ms.",
            "priority": "Medium",
        }
    ],
    "user_stories": [
        {
            "id": "US-01",
            "as_a": "customer",
            "i_want": "to search for restaurants",
            "so_that": "I can order food",
        }
    ],
    "assumptions": ["Single city initially"],
    "scope": ["Web app", "Rider tracking"],
    "confidence": 0.9,
}

ARCHITECTURE_SAMPLE = {
    "architecture": "Modular monolith",
    "database": "PostgreSQL",
    "authentication": "JWT",
    "services": ["orders", "catalog", "payments"],
    "apis": [{"method": "GET", "path": "/api/restaurants", "purpose": "List restaurants"}],
    "deployment": ["Docker", "Render"],
    "confidence": 0.85,
}

PLANNING_SAMPLE = {
    "sprints": [
        {
            "id": "S1",
            "name": "Foundation",
            "goals": ["Project setup", "Auth"],
            "tasks": ["Initialize repo", "User model", "JWT login"],
        }
    ],
    "timeline": [{"phase": "Sprint 1", "duration": "2 weeks"}],
    "deliverables": ["Working skeleton"],
    "risks": [{"risk": "Scope creep", "mitigation": "Freeze scope after sprint 2"}],
    "confidence": 0.8,
}

BACKEND_SAMPLE = {
    "folder_structure": ["backend/app/", "backend/app/api/", "backend/app/core/"],
    "apis": [{"method": "POST", "path": "/api/orders", "purpose": "Create order"}],
    "models": [{"name": "Order", "fields": [{"name": "id", "type": "uuid", "constraints": "PK"}]}],
    "endpoints": [{"method": "POST", "path": "/api/orders", "description": "Create a new order"}],
    "confidence": 0.82,
}

FRONTEND_SAMPLE = {
    "pages": [{"name": "Home", "route": "/", "description": "Restaurant list"}],
    "components": ["RestaurantCard", "CartDrawer"],
    "routes": [{"path": "/", "page": "Home"}],
    "state_management": "TanStack Query + Zustand",
    "ui_layout": "App shell with top nav and bottom cart bar",
    "confidence": 0.8,
}

QA_SAMPLE = {
    "test_cases": [
        {
            "id": "TC-01",
            "title": "Place order",
            "steps": ["Add to cart", "Checkout"],
            "expected": "Order created",
        }
    ],
    "acceptance_criteria": ["User can place an order within 3 steps"],
    "edge_cases": ["Empty cart checkout"],
    "confidence": 0.78,
}

DOCUMENTATION_SAMPLE = {
    "readme": "# Food Delivery App\n\nOrder food from local restaurants.",
    "installation": "```bash\npip install -r requirements.txt\n```",
    "setup_guide": "Set env vars and run uvicorn.",
    "api_summary": "| Method | Path | Purpose |\n|---|---|---|\n| POST | /api/orders | Create order |",
    "confidence": 0.9,
}

ALL_SAMPLES = [
    PM_SAMPLE,
    REQUIREMENTS_SAMPLE,
    ARCHITECTURE_SAMPLE,
    PLANNING_SAMPLE,
    BACKEND_SAMPLE,
    FRONTEND_SAMPLE,
    QA_SAMPLE,
    DOCUMENTATION_SAMPLE,
]
