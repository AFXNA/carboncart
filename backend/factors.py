"""Material and transport keys, read from the frontend's emission-factor table.

src/data/emissionFactors.js stays the single source of truth for the factors (the browser
runs the calculator); the backend only needs the valid keys so Gemini can be constrained to them.
"""
import re
from pathlib import Path

FACTORS_JS = Path(__file__).resolve().parent.parent / "src" / "data" / "emissionFactors.js"


def _keys(source: str, name: str) -> list[str]:
    block = re.search(rf"export const {name} = \{{\n(.*?)\n\}};", source, re.S)
    if not block:
        raise RuntimeError(f"Could not find {name} in {FACTORS_JS}")
    return re.findall(r"^  (\w+): \{", block.group(1), re.M)


_source = FACTORS_JS.read_text(encoding="utf-8").replace("\r\n", "\n")
MATERIAL_KEYS = _keys(_source, "MATERIALS")
TRANSPORT_MODES = _keys(_source, "TRANSPORT")
