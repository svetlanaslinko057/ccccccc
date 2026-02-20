"""
O20.3 & O20.4: Return Management API Routes
"""
from fastapi import APIRouter, Depends, Query
from typing import Optional
from core.db import db
from core.security import get_current_admin
from modules.returns.return_engine import ReturnEngine
from modules.returns.return_analytics import ReturnAnalyticsService

router = APIRouter(prefix="/returns", tags=["Returns Management"])


@router.post("/run")
async def run_returns_engine(
    limit: int = Query(default=500, le=1000),
    admin: dict = Depends(get_current_admin)
):
    """
    Manually trigger return detection engine.
    Scans active shipments and detects returns.
    """
    engine = ReturnEngine(db)
    return await engine.run_once(limit=limit)


@router.get("/list")
async def list_returns(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, le=200),
    stage: Optional[str] = Query(default=None, description="RETURNING, RETURNED, RESOLVED"),
    admin: dict = Depends(get_current_admin)
):
    """
    List orders with return events.
    """
    query = {"returns.stage": {"$in": ["RETURNING", "RETURNED", "RESOLVED"]}}
    if stage:
        query["returns.stage"] = stage
        
    cursor = db["orders"].find(query, {"_id": 0}).sort("returns.updated_at", -1).skip(skip).limit(limit)
    items = [x async for x in cursor]
    total = await db["orders"].count_documents(query)
    
    return {"items": items, "total": total, "skip": skip, "limit": limit}


@router.get("/summary")
async def get_returns_summary(admin: dict = Depends(get_current_admin)):
    """
    Get return analytics KPIs:
    - Returns today/7d/30d
    - Return rate
    - Shipping losses
    - Top reasons
    - Top cities
    """
    service = ReturnAnalyticsService(db)
    return await service.summary()


@router.get("/trend")
async def get_returns_trend(
    days: int = Query(default=30, le=90),
    admin: dict = Depends(get_current_admin)
):
    """Get daily return trend for charts"""
    service = ReturnAnalyticsService(db)
    return await service.daily_trend(days)


@router.get("/risk-customers")
async def get_risk_customers(
    limit: int = Query(default=20, le=100),
    admin: dict = Depends(get_current_admin)
):
    """Get customers with high return rates"""
    service = ReturnAnalyticsService(db)
    return await service.risk_customers(limit)


@router.post("/resolve")
async def resolve_return(
    request: dict,
    admin: dict = Depends(get_current_admin)
):
    """
    Mark return as resolved.
    Use when: parcel returned to warehouse, goods reshelved, situation handled.
    """
    from datetime import datetime, timezone
    
    order_id = request.get("order_id")
    notes = request.get("notes")
    
    if not order_id:
        return {"ok": False, "error": "order_id is required"}
    
    result = await db["orders"].update_one(
        {"id": order_id},
        {"$set": {
            "returns.stage": "RESOLVED",
            "returns.resolved_at": datetime.now(timezone.utc).isoformat(),
            "returns.resolved_notes": notes
        }}
    )
    
    if result.modified_count == 0:
        return {"ok": False, "error": "Order not found or already resolved"}
    
    return {"ok": True, "order_id": order_id}


@router.post("/find")
async def find_by_ttn(
    ttn: str,
    admin: dict = Depends(get_current_admin)
):
    """Find order by TTN and get return status"""
    order = await db["orders"].find_one(
        {"shipment.ttn": ttn},
        {"_id": 0, "id": 1, "status": 1, "returns": 1, "shipment": 1, "totals": 1, "shipping": 1}
    )
    
    if not order:
        return {"ok": False, "error": "Order not found"}
    
    return {"ok": True, "order": order}


@router.post("/process-ttn")
async def process_single_ttn(
    ttn: str,
    admin: dict = Depends(get_current_admin)
):
    """
    Manually process single TTN for return detection.
    Useful for testing or manual investigation.
    """
    engine = ReturnEngine(db)
    return await engine.process_single_ttn(ttn)
