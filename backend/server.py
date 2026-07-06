from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import json
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Storage path for the encrypted vault blob. Server treats this as opaque bytes.
VAULT_PATH = Path(os.environ['VAULT_STORAGE_PATH'])
VAULT_PATH.parent.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Vaultkey")
api_router = APIRouter(prefix="/api")


class EncryptedBlob(BaseModel):
    """Opaque encrypted vault blob. All crypto happens client-side; server never sees plaintext."""
    v: int = Field(default=1, description="blob format version")
    kdf: str = Field(default="PBKDF2-SHA256")
    iterations: int
    salt: str  # base64
    iv: str    # base64
    ct: str    # base64 ciphertext (contains auth tag as AES-GCM)
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


@api_router.get("/")
async def root():
    return {"service": "vaultkey", "ok": True}


@api_router.get("/vault/status")
async def vault_status():
    exists = VAULT_PATH.exists() and VAULT_PATH.stat().st_size > 0
    size = VAULT_PATH.stat().st_size if exists else 0
    return {
        "initialized": exists,
        "size_bytes": size,
        "path": str(VAULT_PATH),
    }


@api_router.get("/vault")
async def get_vault():
    if not VAULT_PATH.exists() or VAULT_PATH.stat().st_size == 0:
        raise HTTPException(status_code=404, detail="Vault not initialized")
    try:
        with VAULT_PATH.open("r", encoding="utf-8") as f:
            data = json.load(f)
        return JSONResponse(content=data)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Corrupted vault file")


@api_router.put("/vault")
async def put_vault(blob: EncryptedBlob):
    blob.updated_at = datetime.now(timezone.utc).isoformat()
    payload = blob.model_dump()
    tmp = VAULT_PATH.with_suffix(VAULT_PATH.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8") as f:
        json.dump(payload, f)
    tmp.replace(VAULT_PATH)
    return {"ok": True, "updated_at": payload["updated_at"], "size_bytes": VAULT_PATH.stat().st_size}


@api_router.delete("/vault")
async def delete_vault():
    """Destroy the encrypted vault file (used for reset)."""
    if VAULT_PATH.exists():
        VAULT_PATH.unlink()
    return {"ok": True}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Mount static files
frontend_build = ROOT_DIR.parent / "frontend" / "build"
if frontend_build.exists():
    app.mount("/", StaticFiles(directory=str(frontend_build), html=True), name="static")
else:
    logger.warning(f"Frontend build directory not found at {frontend_build}. Static files will not be served.")

