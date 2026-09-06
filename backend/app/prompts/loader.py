from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[2]
PROMPTS_DIR = BACKEND_DIR.parent / "prompts"


class PromptLoader:
    def __init__(self, prompts_dir: Path | None = None):
        self.prompts_dir = prompts_dir or PROMPTS_DIR

    def load_system(self, agent: str) -> str:
        path = self.prompts_dir / f"{agent}.system.md"
        if not path.exists():
            path = self.prompts_dir / "system.md"
        return path.read_text(encoding="utf-8")

    def load_user_template(self, agent: str) -> str:
        return (self.prompts_dir / f"{agent}.user.md").read_text(encoding="utf-8")

    def render_user(self, agent: str, **kwargs) -> str:
        return self.load_user_template(agent).format(**kwargs)
