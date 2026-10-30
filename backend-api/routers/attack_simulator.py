from fastapi import APIRouter, Depends
import hashlib
from datetime import datetime, timezone

router = APIRouter(prefix="/api/simulator", tags=["Cybersecurity Threat Simulator"])

@router.post("/simulate-breach")
async def simulate_insider_breach(student_id: int = 1):
    """Return a mock integrity alert without changing any database records."""
    return {
        "status": "simulated",
        "simulation": True,
        "message": "Demo integrity alert generated. No database records were changed.",
        "compromised_student_id": student_id,
        "live_hash": hashlib.sha256(f"demo-live-{student_id}".encode()).hexdigest(),
        "locked_hash": hashlib.sha256(f"demo-locked-{student_id}".encode()).hexdigest(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }