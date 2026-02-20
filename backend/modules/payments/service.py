"""
Payment Service - High-level payment operations
"""
from typing import Dict, Any

from core.db import db
from core.config import settings
from modules.orders.order_repository import order_repository
from modules.orders.order_status import OrderStatus
from .payment_webhook_service import payment_webhook_service
from .providers.fondy import FondyProvider


class PaymentsService:
    """Service for payment operations"""
    
    def __init__(self):
        self.provider = FondyProvider()
    
    async def create_checkout(self, order_id: str) -> Dict[str, Any]:
        """Create checkout session for order"""
        
        # Get order
        order = await order_repository.get_by_id(order_id)
        if not order:
            raise ValueError("ORDER_NOT_FOUND")
        
        # Verify order is in correct state
        current_status = OrderStatus(order.get("status", "NEW"))
        if current_status not in {OrderStatus.NEW, OrderStatus.AWAITING_PAYMENT}:
            raise ValueError(f"ORDER_NOT_PAYABLE: current status is {current_status.value}")
        
        # Create payment with provider
        result = await self.provider.create_payment(order)
        
        # Update order with payment info
        await db["orders"].update_one(
            {"id": order_id},
            {
                "$set": {
                    "status": OrderStatus.AWAITING_PAYMENT.value,
                    "payment.provider": self.provider.name,
                    "payment.provider_payment_id": result["provider_payment_id"],
                    "payment.checkout_url": result["checkout_url"],
                    "payment.status": "PENDING",
                }
            }
        )
        
        return {
            "checkout_url": result["checkout_url"],
            "provider": self.provider.name,
            "order_id": order_id,
        }
    
    async def handle_webhook(
        self, 
        raw_body: bytes, 
        payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle payment webhook"""
        
        # Verify signature
        self.provider.verify_webhook(raw_body, payload)
        
        # Parse webhook
        parsed = self.provider.parse_webhook(payload)
        
        # Only process successful payments
        if parsed["status"] == "PAID":
            return await payment_webhook_service.handle_paid(
                provider=self.provider.name,
                payload=payload,
                payment_id=parsed["payment_id"],
                event_id=parsed["event_id"],
                amount=parsed["amount"],
                currency=parsed["currency"],
                order_id=parsed["order_id"],
                signature=payload.get("signature"),
            )
        
        # Log other statuses but don't fail
        return {
            "ok": True,
            "status": parsed["status"],
            "order_id": parsed.get("order_id"),
        }
    
    async def get_payment_status(self, order_id: str) -> Dict[str, Any]:
        """Get payment status for order"""
        
        order = await order_repository.get_by_id(order_id)
        if not order:
            raise ValueError("ORDER_NOT_FOUND")
        
        # Handle case where payment is explicitly None
        payment = order.get("payment") or {}
        
        return {
            "order_id": order_id,
            "order_status": order.get("status"),
            "payment_status": payment.get("status", "UNKNOWN"),
            "provider": payment.get("provider"),
            "checkout_url": payment.get("checkout_url"),
        }


# Singleton instance
payments_service = PaymentsService()
