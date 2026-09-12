from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from analyzer import analyze_payload

app = FastAPI(title="Cyber Shield API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScanRequest(BaseModel):
    content: str
    content_type: str = "Message"

class ReportRequest(BaseModel):
    threatType: str
    severity: str
    details: str
    source: str = ""

SCAN_HISTORY = []

THREAT_FEED = [
    {
        "id": "CS-RPT-001",
        "threatType": "SBI KYC Smishing Campaign",
        "severity": "HIGH",
        "riskLevel": "HIGH",
        "details": "Dear Customer, Your SBI account will be blocked in 24h. Update PAN at http://onlinesbi-update.xyz",
        "source": "SMS (+91-9876543210)",
        "createdAt": datetime.now().isoformat(),
        "kind": "report"
    },
    {
        "id": "CS-RPT-002",
        "threatType": "Reverse-UPI ₹5,000 Reward Trap",
        "severity": "HIGH",
        "riskLevel": "HIGH",
        "details": "You won ₹5,000 cashback! Scan QR to credit amount: upi://pay?pa=scam@okhdfc&pn=Reward&am=5000",
        "source": "WhatsApp QR Code",
        "createdAt": datetime.now().isoformat(),
        "kind": "report"
    },
    {
        "id": "CS-RPT-003",
        "threatType": "Electricity Disconnection Threat",
        "severity": "MEDIUM",
        "riskLevel": "MEDIUM",
        "details": "Electricity power disconnected tonight at 9:30 PM due to unpaid bill. Call 9876543210 immediately.",
        "source": "SMS",
        "createdAt": datetime.now().isoformat(),
        "kind": "report"
    }
]

@app.post("/api/scan")
def scan_endpoint(req: ScanRequest):
    result = analyze_payload(req.content, req.content_type)
    result["id"] = f"CS-SCN-{len(SCAN_HISTORY) + 1:03d}"
    result["createdAt"] = datetime.now().isoformat()
    SCAN_HISTORY.insert(0, result)
    return result

@app.get("/api/feed")
def get_feed():
    return {"feed": THREAT_FEED}

@app.post("/api/report")
def submit_report(req: ReportRequest):
    report = {
        "id": f"CS-RPT-{len(THREAT_FEED) + 1:03d}",
        "threatType": req.threatType,
        "severity": req.severity,
        "riskLevel": req.severity,
        "details": req.details,
        "source": req.source,
        "createdAt": datetime.now().isoformat(),
        "kind": "report"
    }
    THREAT_FEED.insert(0, report)
    return report

@app.get("/api/history")
def get_history():
    return {"history": THREAT_FEED + SCAN_HISTORY}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)