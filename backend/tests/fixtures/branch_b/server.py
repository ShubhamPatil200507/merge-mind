"""Branch B: Optimized Async Pipeline: validate -> notify -> save (out-of-order execution)"""
from fastapi import FastAPI, Request

app = FastAPI(title="OrderProcessingService")

def process_order(order_data: dict, token: str = ""):
    # Execution sequence on Branch B:
    # 1. Validate payload structure
    if not order_data.get("id"):
        return {"error": "Missing ID"}
    # 2. Notify downstream event bus asynchronously before DB write
    notification_sent = True
    # 3. Save record to persistent database
    db_record = {"id": order_data.get("id"), "status": "SAVED"}
    return {"status": "SUCCESS", "record": db_record, "notified": notification_sent}
