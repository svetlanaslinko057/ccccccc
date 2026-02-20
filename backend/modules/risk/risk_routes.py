"""
O16: Risk Routes
"""
from fastapi import APIRouter, Depends, HTTPException
from core.db import db
from core.security import get_current_admin
from modules.risk.risk_service import RiskService
from modules.bot.bot_settings_repo import BotSettingsRepo
from modules.guard.guard_repo import GuardRepo
from modules.bot.bot_alerts_repo import BotAlertsRepo
from datetime import datetime, timezone

router = APIRouter(prefix="/risk", tags=["Risk"])


def utcnow():
    return datetime.now(timezone.utc).isoformat()


@router.post("/recalc/{user_id}")
async def recalc_risk(user_id: str, current_user: dict = Depends(get_current_admin)):
    """Recalculate risk score for user"""
    svc = RiskService(
        db,
        settings_repo=BotSettingsRepo(db),
        guard_repo=GuardRepo(db),
        alerts_repo=BotAlertsRepo(db),
    )
    rr = await svc.apply_to_user(user_id)
    return {"ok": True, "risk": rr}


@router.post("/override/{user_id}")
async def override_risk(user_id: str, body: dict, current_user: dict = Depends(get_current_admin)):
    """Override risk score manually"""
    score = int(body.get("score", 0))
    until = body.get("until")  # optional expiry
    await db["users"].update_one(
        {"id": user_id},
        {"$set": {"risk_override": {"score": score, "until": until, "by": current_user.get("id"), "at": utcnow()}}}
    )
    return {"ok": True}


@router.delete("/override/{user_id}")
async def clear_override(user_id: str, current_user: dict = Depends(get_current_admin)):
    """Clear risk override"""
    await db["users"].update_one({"id": user_id}, {"$set": {"risk_override": None}})
    return {"ok": True}


@router.get("/distribution")
async def risk_distribution(current_user: dict = Depends(get_current_admin)):
    """Get risk band distribution"""
    pipeline = [
        {"$match": {"risk.score": {"$exists": True}}},
        {"$group": {"_id": "$risk.band", "count": {"$sum": 1}}},
    ]
    rows = await db["users"].aggregate(pipeline).to_list(10)
    return {"distribution": {r["_id"]: r["count"] for r in rows if r.get("_id")}}
