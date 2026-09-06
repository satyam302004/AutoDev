import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import routes_health, routes_memory, routes_projects, routes_settings
from app.core.config import get_settings
from app.core.container import get_container
from app.core.db import init_db
from app.core.logging import setup_logging
from app.core.middleware import RequestIDMiddleware, TimingMiddleware

logger = logging.getLogger("app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    settings = get_settings()
    init_db()
    job_manager = get_container().get_job_manager()
    job_manager.start()
    logger.info(
        "%s starting (env=%s, llm_provider=%s)",
        settings.app_name,
        settings.env,
        settings.llm_provider,
    )
    try:
        yield
    finally:
        await job_manager.stop()
        logger.info("%s stopped", settings.app_name)


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, version=settings.version, lifespan=lifespan)

    app.add_middleware(RequestIDMiddleware)
    app.add_middleware(TimingMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(Exception)
    async def unhandled_error(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled error: %s", exc)
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Internal server error",
                "request_id": getattr(request.state, "request_id", "-"),
            },
        )

    app.include_router(routes_health.router)
    app.include_router(routes_projects.router)
    app.include_router(routes_settings.router)
    app.include_router(routes_memory.router)

    @app.get("/")
    def root() -> dict:
        return {"app": settings.app_name, "version": settings.version, "docs": "/docs"}

    return app


app = create_app()
