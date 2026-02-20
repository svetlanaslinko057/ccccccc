"""
Delivery Module - Nova Poshta Integration
"""
from fastapi import APIRouter, HTTPException
from typing import Optional
import aiohttp

from core.config import settings

router = APIRouter(prefix="/delivery", tags=["Delivery"])

NP_API_URL = "https://api.novaposhta.ua/v2.0/json/"


async def np_request(method: str, model: str, props: dict = None):
    """Make request to Nova Poshta API"""
    payload = {
        "apiKey": settings.NOVAPOSHTA_API_KEY,
        "modelName": model,
        "calledMethod": method,
        "methodProperties": props or {}
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.post(NP_API_URL, json=payload) as resp:
            data = await resp.json()
            if not data.get("success"):
                return []
            return data.get("data", [])


@router.get("/cities")
async def search_cities(query: str, limit: int = 10):
    """Search Nova Poshta cities"""
    if len(query) < 2:
        return []
    
    data = await np_request("searchSettlements", "Address", {
        "CityName": query,
        "Limit": str(limit)
    })
    
    if not data:
        return []
    
    addresses = data[0].get("Addresses", []) if data else []
    return [
        {
            "ref": a.get("Ref"),
            "name": a.get("Present"),
            "delivery_city": a.get("DeliveryCity")
        }
        for a in addresses[:limit]
    ]


@router.get("/warehouses")
async def get_warehouses(city_ref: str, number: Optional[str] = None):
    """Get Nova Poshta warehouses in city"""
    props = {"CityRef": city_ref, "Limit": "50"}
    if number:
        props["FindByString"] = number
    
    data = await np_request("getWarehouses", "Address", props)
    
    return [
        {
            "ref": w.get("Ref"),
            "number": w.get("Number"),
            "description": w.get("Description"),
            "short_address": w.get("ShortAddress")
        }
        for w in data
    ]


@router.get("/calculate")
async def calculate_delivery(
    city_ref: str,
    weight: float = 1,
    cost: float = 1000
):
    """Calculate delivery cost"""
    data = await np_request("getDocumentPrice", "InternetDocument", {
        "CitySender": "8d5a980d-391c-11dd-90d9-001a92567626",  # Kyiv
        "CityRecipient": city_ref,
        "Weight": str(weight),
        "Cost": str(cost),
        "ServiceType": "WarehouseWarehouse",
        "CargoType": "Cargo"
    })
    
    if not data:
        return {"cost": 0, "delivery_date": None}
    
    return {
        "cost": data[0].get("Cost", 0),
        "delivery_date": data[0].get("DeliveryDate", {}).get("date")
    }
