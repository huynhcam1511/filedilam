from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
import random
import string

from database import SessionLocal, Order

app = FastAPI()

# Allow CORS cho frontend HTML
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class OrderCreate(BaseModel):
    customer_name: str
    customer_phone: str
    customer_contact: str
    customer_note: str | None = None
    product_name: str
    product_file_url: str
    amount: int

def generate_order_id():
    return "DH" + "".join(random.choices(string.digits, k=6))

@app.post("/api/orders")
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    order_id = generate_order_id()
    while db.query(Order).filter(Order.id == order_id).first() is not None:
        order_id = generate_order_id()
        
    db_order = Order(
        id=order_id,
        customer_name=order.customer_name,
        customer_phone=order.customer_phone,
        customer_contact=order.customer_contact,
        customer_note=order.customer_note,
        product_name=order.product_name,
        product_file_url=order.product_file_url,
        amount=order.amount,
        status="PENDING"
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    
    return {
        "order_id": db_order.id,
        "amount": db_order.amount,
        "transfer_note": db_order.id,
    }

@app.get("/api/orders/{order_id}")
def get_order_status(order_id: str, db: Session = Depends(get_db)):
    db_order = db.query(Order).filter(Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {
        "order_id": db_order.id,
        "status": db_order.status,
        "product_file_url": db_order.product_file_url if db_order.status == "PAID" else None
    }

@app.post("/api/webhooks/sepay")
async def sepay_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.json()
    
    if payload.get("transferType") == "in":
        content = str(payload.get("content", "")).upper()
        amount_paid = int(payload.get("transferAmount", 0))
        
        # Tìm các đơn đang PENDING
        orders = db.query(Order).filter(Order.status == "PENDING").all()
        for order in orders:
            if order.id in content and amount_paid >= order.amount:
                # Đã thanh toán đủ
                order.status = "PAID"
                db.commit()
                
                # TODO: Thêm logic gửi email tại đây sau
                print(f"Gui Email file {order.product_file_url} toi {order.customer_contact}")
                break
                
    return {"success": True}
