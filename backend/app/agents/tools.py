from dataclasses import dataclass
from typing import Callable

TOOLS: dict[str, "Tool"] = {}


@dataclass
class Tool:
    name: str
    description: str
    fn: Callable[[str], str]

    def run(self, query: str = "") -> str:
        return self.fn(query)


def register_tool(name: str, description: str):
    def decorator(fn: Callable[[str], str]) -> Callable[[str], str]:
        TOOLS[name] = Tool(name=name, description=description, fn=fn)
        return fn

    return decorator


def describe_tools(tools: list[Tool]) -> str:
    return "\n".join(f"- {tool.name}: {tool.description}" for tool in tools)


def run_tools(tools: list[Tool]) -> str:
    parts = []
    for tool in tools:
        try:
            parts.append(f"[{tool.name}]\n{tool.run()}")
        except Exception as exc:
            parts.append(f"[{tool.name}] tool error: {exc}")
    return "\n\n".join(parts)


@register_tool("requirement_templates", "Starter requirement templates for common project types.")
def requirement_templates(query: str = "") -> str:
    return (
        "CRUD app: users, items, search, pagination, auth. "
        "E-commerce: catalog, cart, checkout, orders, payments. "
        "Booking: availability, reservations, calendar, notifications."
    )


@register_tool("project_examples", "A few mini project examples to reference.")
def project_examples(query: str = "") -> str:
    return (
        "Library Management System: books, members, borrowing, fines. "
        "Food Delivery App: restaurants, menu, orders, riders, tracking. "
        "Hospital Management: patients, doctors, appointments, records."
    )


@register_tool("tech_stack_catalog", "Catalog of recommended technologies by category.")
def tech_stack_catalog(query: str = "") -> str:
    return (
        "Frontend: React+Vite, Next.js, Vue. Backend: FastAPI, Django, Express. "
        "Database: PostgreSQL, SQLite, MongoDB. Auth: JWT, OAuth2. "
        "Deployment: Docker, Render, Vercel, GitHub Actions."
    )


@register_tool("design_patterns", "Common architectural patterns.")
def design_patterns(query: str = "") -> str:
    return (
        "Monolith, Modular monolith, Microservices, Layered, Hexagonal, Event-driven. "
        "Recommend the simplest pattern that fits the requirements."
    )


@register_tool("rest_conventions", "Standard REST API conventions.")
def rest_conventions(query: str = "") -> str:
    return (
        "Nouns not verbs; plural resources; GET/POST/PUT/DELETE; "
        "HTTP status codes (200/201/400/404); pagination params; "
        "JSON request/response; version prefix /api/v1."
    )


@register_tool("markdown_templates", "Markdown section templates for documentation.")
def markdown_templates(query: str = "") -> str:
    return (
        "README: # Title, ## Overview, ## Features, ## Tech Stack, ## Getting Started, ## License. "
        "API: endpoint table, request/response examples."
    )
