"""
Cart Module - Models & Routes
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone

from core.db import db
from core.security import get_current_user

router = APIRouter(prefix="/cart", tags=["Cart"])


class CartItem(BaseModel):
    product_id: str
    quantity: int = 1


class AddToCartRequest(BaseModel):
    product_id: str
    quantity: int = 1


class CartItemResponse(BaseModel):
    product_id: str
    quantity: int
    product: Optional[dict] = None


class CartResponse(BaseModel):
    items: List[CartItemResponse]
    total: float
    count: int


@router.get("", response_model=CartResponse)
async def get_cart(current_user: dict = Depends(get_current_user)):
    """Get current user's cart"""
    cart = await db.carts.find_one({"user_id": current_user["id"]}, {"_id": 0})
    
    if not cart:
        return CartResponse(items=[], total=0, count=0)
    
    items = []
    total = 0
    
    for item in cart.get("items", []):
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        if product:
            items.append(CartItemResponse(
                product_id=item["product_id"],
                quantity=item["quantity"],
                product=product
            ))
            total += product["price"] * item["quantity"]
    
    return CartResponse(
        items=items,
        total=total,
        count=sum(i.quantity for i in items)
    )


@router.post("/add")
async def add_to_cart(
    data: AddToCartRequest,
    current_user: dict = Depends(get_current_user)
):
    """Add item to cart"""
    # Verify product exists
    product = await db.products.find_one({"id": data.product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    user_id = current_user["id"]
    cart = await db.carts.find_one({"user_id": user_id})
    
    if not cart:
        await db.carts.insert_one({
            "user_id": user_id,
            "items": [{"product_id": data.product_id, "quantity": data.quantity}],
            "updated_at": datetime.now(timezone.utc)
        })
    else:
        # Check if product already in cart
        existing = next((i for i in cart.get("items", []) if i["product_id"] == data.product_id), None)
        
        if existing:
            await db.carts.update_one(
                {"user_id": user_id, "items.product_id": data.product_id},
                {
                    "$inc": {"items.$.quantity": data.quantity},
                    "$set": {"updated_at": datetime.now(timezone.utc)}
                }
            )
        else:
            await db.carts.update_one(
                {"user_id": user_id},
                {
                    "$push": {"items": {"product_id": data.product_id, "quantity": data.quantity}},
                    "$set": {"updated_at": datetime.now(timezone.utc)}
                }
            )
    
    return {"message": "Added to cart"}


@router.post("/update")
async def update_cart_item(
    data: AddToCartRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update cart item quantity"""
    user_id = current_user["id"]
    
    if data.quantity <= 0:
        await db.carts.update_one(
            {"user_id": user_id},
            {"$pull": {"items": {"product_id": data.product_id}}}
        )
    else:
        await db.carts.update_one(
            {"user_id": user_id, "items.product_id": data.product_id},
            {"$set": {"items.$.quantity": data.quantity, "updated_at": datetime.now(timezone.utc)}}
        )
    
    return {"message": "Cart updated"}


@router.delete("/{product_id}")
async def remove_from_cart(
    product_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Remove item from cart"""
    await db.carts.update_one(
        {"user_id": current_user["id"]},
        {"$pull": {"items": {"product_id": product_id}}}
    )
    return {"message": "Removed from cart"}


@router.delete("")
async def clear_cart(current_user: dict = Depends(get_current_user)):
    """Clear entire cart"""
    await db.carts.update_one(
        {"user_id": current_user["id"]},
        {"$set": {"items": [], "updated_at": datetime.now(timezone.utc)}}
    )
    return {"message": "Cart cleared"}
