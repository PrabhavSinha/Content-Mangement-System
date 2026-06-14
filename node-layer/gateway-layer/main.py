from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import requests

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SPRING_BOOT_URL = "http://localhost:8080/api/sql"
NODE_JS_URL     = "http://localhost:5000/api/mongo"

# ─────────────────────────────────────────────
# HELPER FUNCTIONS
# ─────────────────────────────────────────────
def safe_post(url, payload, headers={}):
    try:
        res = requests.post(url, json=payload, headers=headers, timeout=10)
        return res.json()
    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=503, detail=f"Cannot reach service at {url}")
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail=f"Service timed out at {url}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def safe_get(url, headers={}):
    try:
        res = requests.get(url, headers=headers, timeout=10)
        return res.json()
    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=503, detail=f"Cannot reach service at {url}")
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail=f"Service timed out at {url}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def safe_delete(url, headers={}):
    try:
        res = requests.delete(url, headers=headers, timeout=10)
        return res.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Extract Authorization header from incoming request and forward it
def get_auth_header(request: Request):
    auth = request.headers.get("Authorization")
    if auth:
        return {"Authorization": auth}
    return {}

# ─────────────────────────────────────────────
# AUTH ROUTES
# ─────────────────────────────────────────────

@app.post("/gateway/signup")
def signup(payload: dict):
    result = safe_post(f"{SPRING_BOOT_URL}/signup", payload)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@app.post("/gateway/login")
def login(payload: dict):
    result = safe_post(f"{SPRING_BOOT_URL}/login", payload)
    if "error" in result:
        raise HTTPException(status_code=401, detail=result["error"])
    return result  # includes JWT token

@app.get("/gateway/verify")
def verify_token(request: Request):
    headers = get_auth_header(request)
    return safe_get(f"{SPRING_BOOT_URL}/verify", headers=headers)

# ─────────────────────────────────────────────
# DRAFT ROUTES — JWT forwarded
# ─────────────────────────────────────────────

@app.post("/gateway/drafts")
def save_draft(payload: dict, request: Request):
    headers = get_auth_header(request)
    result = safe_post(f"{SPRING_BOOT_URL}/drafts", payload, headers=headers)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@app.get("/gateway/drafts")
def get_drafts():
    return safe_get(f"{SPRING_BOOT_URL}/drafts")

@app.delete("/gateway/drafts/{draft_id}")
def delete_draft(draft_id: int, request: Request):
    headers = get_auth_header(request)
    return safe_delete(f"{SPRING_BOOT_URL}/drafts/{draft_id}", headers=headers)

# ─────────────────────────────────────────────
# PUBLISH ROUTES — JWT forwarded
# ─────────────────────────────────────────────

@app.post("/gateway/publish")
def publish_content(payload: dict, request: Request):
    headers = get_auth_header(request)

    # Step 1: Save to PostgreSQL via Spring Boot (with JWT)
    sql_data = safe_post(f"{SPRING_BOOT_URL}/publish", payload, headers=headers)
    if "error" in sql_data:
        raise HTTPException(status_code=400, detail=sql_data["error"])

    # Step 2: Sync to MongoDB (non-blocking)
    try:
        mongo_payload = {
            "contentId": sql_data.get("contentId"),
            "title":     sql_data.get("title"),
            "body":      sql_data.get("body"),
            "authorId":  sql_data.get("authorId"),
            "version":   1,
            "status":    "published"
        }
        requests.post(f"{NODE_JS_URL}/version", json=mongo_payload, timeout=5)
    except Exception:
        print("[WARNING] MongoDB version sync failed")

    return sql_data

@app.get("/gateway/content")
def get_content():
    return safe_get(f"{SPRING_BOOT_URL}/content")

# ADMIN ONLY — delete published content
@app.delete("/gateway/content/{content_id}")
def delete_content(content_id: int, request: Request):
    headers = get_auth_header(request)
    return safe_delete(f"{SPRING_BOOT_URL}/content/{content_id}", headers=headers)

# ─────────────────────────────────────────────
# SEARCH ROUTE — Node.js vector search
# ─────────────────────────────────────────────

@app.post("/gateway/search")
def search_content(payload: dict):
    try:
        return safe_post(f"{NODE_JS_URL}/search", payload)
    except HTTPException:
        print("[WARNING] Node.js search service unreachable")
        return []

# ADMIN ONLY — get all users
@app.get("/gateway/admin/users")
def get_all_users(request: Request):
    headers = get_auth_header(request)
    return safe_get(f"{SPRING_BOOT_URL}/admin/users", headers=headers)

# ─────────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────────

@app.get("/health")
def health_check():
    status = {}
    try:
        requests.get(f"{SPRING_BOOT_URL}/content", timeout=3)
        status["spring_boot"] = "UP"
    except:
        status["spring_boot"] = "DOWN — check port 8080"
    try:
        requests.get(f"http://localhost:5000/health", timeout=3)
        status["node_js"] = "UP"
    except:
        status["node_js"] = "DOWN — check port 5000"
    status["gateway"] = "UP"
    return status