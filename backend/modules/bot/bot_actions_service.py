"""
O10: Bot Actions Service - executes actions from bot callbacks
Calls existing services (TTN, CRM, Notifications)
"""
from motor.motor_asyncio import AsyncIOMotorDatabase
import logging

logger = logging.getLogger(__name__)


class BotActionsService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    async def create_ttn(self, order_id: str) -> dict:
        """Create TTN for order via NovaPoshta service"""
        try:
            from modules.delivery.np.np_ttn_service import NPTTNService
            from modules.delivery.np.np_types import NPTTNCreateRequest
            
            service = NPTTNService(self.db)
            await service.init()
            
            request = NPTTNCreateRequest(order_id=order_id)
            result = await service.create_ttn(request)
            
            return {
                "ok": True,
                "ttn": result.ttn,
                "cost": result.cost,
                "estimated_delivery_date": result.estimated_delivery_date
            }
        except Exception as e:
            logger.error(f"Failed to create TTN: {e}")
            return {"ok": False, "error": str(e)}

    async def refresh_tracking(self, order_id: str) -> dict:
        """Refresh tracking status for order"""
        try:
            from modules.delivery.np.np_ttn_service import NPTTNService
            
            # Get order to find TTN
            order = await self.db["orders"].find_one({"id": order_id}, {"_id": 0})
            if not order:
                return {"ok": False, "error": "ORDER_NOT_FOUND"}
            
            ttn = (order.get("shipment") or {}).get("ttn")
            if not ttn:
                return {"ok": False, "error": "NO_TTN"}
            
            service = NPTTNService(self.db)
            result = await service.sync_tracking_to_order(order_id, ttn)
            
            return {"ok": True, "result": result}
        except Exception as e:
            logger.error(f"Failed to refresh tracking: {e}")
            return {"ok": False, "error": str(e)}

    async def mark_vip(self, order_id: str) -> dict:
        """Mark customer as VIP based on order"""
        try:
            order = await self.db["orders"].find_one({"id": order_id}, {"_id": 0})
            if not order:
                return {"ok": False, "error": "ORDER_NOT_FOUND"}
            
            phone = (order.get("shipping") or {}).get("phone")
            if not phone:
                return {"ok": False, "error": "NO_PHONE"}
            
            from modules.crm.actions.crm_actions_service import CRMActionsService
            service = CRMActionsService(self.db)
            
            # Get current customer
            customer = await self.db["customers"].find_one({"phone": phone}, {"_id": 0})
            current_tags = customer.get("tags", []) if customer else []
            
            if "VIP" not in current_tags:
                current_tags.append("VIP")
            
            await service.set_tags(phone, current_tags)
            
            # Also update segment
            await self.db["customers"].update_one(
                {"phone": phone},
                {"$set": {"segment": "VIP"}}
            )
            
            return {"ok": True, "phone": phone, "tags": current_tags}
        except Exception as e:
            logger.error(f"Failed to mark VIP: {e}")
            return {"ok": False, "error": str(e)}

    async def mark_risk(self, order_id: str) -> dict:
        """Mark customer as RISK based on order"""
        try:
            order = await self.db["orders"].find_one({"id": order_id}, {"_id": 0})
            if not order:
                return {"ok": False, "error": "ORDER_NOT_FOUND"}
            
            phone = (order.get("shipping") or {}).get("phone")
            if not phone:
                return {"ok": False, "error": "NO_PHONE"}
            
            from modules.crm.actions.crm_actions_service import CRMActionsService
            service = CRMActionsService(self.db)
            
            customer = await self.db["customers"].find_one({"phone": phone}, {"_id": 0})
            current_tags = customer.get("tags", []) if customer else []
            
            if "RISK" not in current_tags:
                current_tags.append("RISK")
            
            await service.set_tags(phone, current_tags)
            await self.db["customers"].update_one(
                {"phone": phone},
                {"$set": {"segment": "RISK"}}
            )
            
            return {"ok": True, "phone": phone, "tags": current_tags}
        except Exception as e:
            logger.error(f"Failed to mark RISK: {e}")
            return {"ok": False, "error": str(e)}

    async def block_customer(self, order_id: str) -> dict:
        """Block customer based on order"""
        try:
            order = await self.db["orders"].find_one({"id": order_id}, {"_id": 0})
            if not order:
                return {"ok": False, "error": "ORDER_NOT_FOUND"}
            
            phone = (order.get("shipping") or {}).get("phone")
            if not phone:
                return {"ok": False, "error": "NO_PHONE"}
            
            from modules.crm.actions.crm_actions_service import CRMActionsService
            service = CRMActionsService(self.db)
            
            await service.toggle_block(phone, True)
            
            return {"ok": True, "phone": phone, "blocked": True}
        except Exception as e:
            logger.error(f"Failed to block customer: {e}")
            return {"ok": False, "error": str(e)}

    async def send_sms(self, order_id: str, custom_text: str = None) -> dict:
        """Send SMS to customer"""
        try:
            order = await self.db["orders"].find_one({"id": order_id}, {"_id": 0})
            if not order:
                return {"ok": False, "error": "ORDER_NOT_FOUND"}
            
            phone = (order.get("shipping") or {}).get("phone")
            if not phone:
                return {"ok": False, "error": "NO_PHONE"}
            
            ttn = (order.get("shipment") or {}).get("ttn", "")
            
            text = custom_text or f"Y-Store: Вашу посилку відправлено. ТТН: {ttn}."
            
            from modules.crm.actions.crm_actions_service import CRMActionsService
            service = CRMActionsService(self.db)
            await service.queue_sms(phone, text)
            
            return {"ok": True, "phone": phone, "text": text}
        except Exception as e:
            logger.error(f"Failed to send SMS: {e}")
            return {"ok": False, "error": str(e)}

    async def get_order_details(self, order_id: str) -> dict:
        """Get order details for display"""
        order = await self.db["orders"].find_one({"id": order_id}, {"_id": 0})
        if not order:
            return {"ok": False, "error": "ORDER_NOT_FOUND"}
        
        return {"ok": True, "order": order}

    async def get_pdf_url(self, ttn: str) -> str:
        """Get PDF label URL for TTN"""
        # In production, this would call NP API to get PDF
        # For now, return internal endpoint
        import os
        base = os.getenv("INTERNAL_API_BASE", "http://127.0.0.1:8001")
        return f"{base}/api/v2/delivery/novaposhta/ttn/{ttn}/label.pdf"
