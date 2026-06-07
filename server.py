from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import json
import uuid
from datetime import datetime, timezone


ROOT = Path(__file__).resolve().parent
CONTENT_FILE = ROOT / "content.json"
SUBMISSIONS_FILE = ROOT / "submissions.json"
LOG_FILE = ROOT / "cms-server.log"


def log(message):
    timestamp = datetime.now(timezone.utc).isoformat()
    with LOG_FILE.open("a", encoding="utf-8") as file:
        file.write(f"[{timestamp}] {message}\n")


class CmsHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        if self.path == "/admin":
            self.path = "/admin.html"
            return super().do_GET()
        if self.path == "/api/content":
            return self.send_json(read_json(CONTENT_FILE, {}))
        if self.path == "/api/submissions":
            return self.send_json(read_json(SUBMISSIONS_FILE, []))
        return super().do_GET()

    def do_PUT(self):
        if self.path != "/api/content":
            return self.send_json({"ok": False, "error": "API route not found."}, 404)
        try:
            data = json.loads(self.read_body())
            write_json(CONTENT_FILE, data)
            self.send_json({"ok": True, "savedAt": datetime.now(timezone.utc).isoformat()})
        except Exception as error:
            self.send_json({"ok": False, "error": str(error)}, 400)

    def do_POST(self):
        if self.path != "/api/submissions":
            return self.send_json({"ok": False, "error": "API route not found."}, 404)
        try:
            payload = json.loads(self.read_body())
            submissions = read_json(SUBMISSIONS_FILE, [])
            submissions.insert(0, {
                "id": str(uuid.uuid4()),
                "createdAt": datetime.now(timezone.utc).isoformat(),
                **payload
            })
            write_json(SUBMISSIONS_FILE, submissions)
            self.send_json({"ok": True}, 201)
        except Exception as error:
            self.send_json({"ok": False, "error": str(error)}, 400)

    def read_body(self):
        length = int(self.headers.get("content-length", 0))
        return self.rfile.read(length).decode("utf-8")

    def send_json(self, data, status=200):
        body = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        log(format % args)


def read_json(path, fallback):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return fallback


def write_json(path, data):
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", 4173), CmsHandler)
    log("LeadHound CMS running at http://localhost:4173/")
    log("Admin editor: http://localhost:4173/admin")
    server.serve_forever()
