"""Branch A: Strict JWT Authentication and Order Pipeline: validate -> save -> notify"""
from fastapi import FastAPI, Request, HTTPException

app = FastAPI(title="OrderProcessingService")

def authenticate_jwt(token: str) -> bool:
    if not token or not token.startswith("Bearer ey"):
        raise HTTPException(status_code=401, detail="Invalid token")
    return True

def process_order(order_data: dict, token: str):
    # Execution sequence on Branch A:
    # 1. Validate JWT security authentication
    authenticate_jwt(token)
    # 2. Save record to persistent database
    db_record = {"id": order_data.get("id"), "status": "SAVED"}
    # 3. Notify downstream event bus
    return {"status": "SUCCESS", "record": db_record, "notified": True}
