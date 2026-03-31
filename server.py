import json
import re
from email.parser import BytesParser
from email.policy import default
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

BASE_DIR = Path(__file__).resolve().parent
SLIDESHOW_DIR = BASE_DIR / "SlideshowImages"
EF_IMAGES_DIR = BASE_DIR / "EF_Images"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}


def _safe_filename(filename: str) -> str:
    cleaned = Path(filename).name
    cleaned = re.sub(r"[^A-Za-z0-9._() -]", "_", cleaned)
    if not cleaned:
        cleaned = "upload.jpg"

    extension = Path(cleaned).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        cleaned = f"{Path(cleaned).stem}.jpg"

    return cleaned


def _unique_path(directory: Path, filename: str) -> Path:
    candidate = directory / filename
    if not candidate.exists():
        return candidate

    stem = candidate.stem
    suffix = candidate.suffix
    index = 1
    while True:
        numbered = directory / f"{stem}-{index}{suffix}"
        if not numbered.exists():
            return numbered
        index += 1


class UploadHandler(SimpleHTTPRequestHandler):
    def _json_response(self, status: int, payload: dict) -> None:
        data = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/upload":
            self._handle_upload(SLIDESHOW_DIR, "SlideshowImages")
        elif parsed.path == "/upload-ef":
            self._handle_upload(EF_IMAGES_DIR, "EF_Images")
        else:
            self._json_response(404, {"success": False, "error": "Not found"})

    def _handle_upload(self, target_dir: Path, url_prefix: str) -> None:
        content_type = self.headers.get("Content-Type", "")
        content_length = int(self.headers.get("Content-Length", "0"))

        if "multipart/form-data" not in content_type or content_length <= 0:
            self._json_response(400, {"success": False, "error": "Invalid upload request"})
            return

        body = self.rfile.read(content_length)
        wrapped = (
            f"Content-Type: {content_type}\r\nMIME-Version: 1.0\r\n\r\n".encode("utf-8")
            + body
        )
        message = BytesParser(policy=default).parsebytes(wrapped)

        photo_part = None
        if message.is_multipart():
            for part in message.iter_parts():
                name = part.get_param("name", header="Content-Disposition")
                if name == "photo":
                    photo_part = part
                    break

        if photo_part is None:
            self._json_response(400, {"success": False, "error": "No photo file uploaded"})
            return

        raw_filename = photo_part.get_filename() or "upload.jpg"
        safe_name = _safe_filename(raw_filename)

        target_dir.mkdir(parents=True, exist_ok=True)
        destination = _unique_path(target_dir, safe_name)
        payload = photo_part.get_payload(decode=True) or b""
        destination.write_bytes(payload)

        self._json_response(
            200,
            {
                "success": True,
                "filename": destination.name,
                "path": f"{url_prefix}/{destination.name}",
            },
        )

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/slideshow-images":
            SLIDESHOW_DIR.mkdir(parents=True, exist_ok=True)
            images = [
                item.name
                for item in sorted(SLIDESHOW_DIR.iterdir())
                if item.is_file() and item.suffix.lower() in ALLOWED_EXTENSIONS
            ]
            self._json_response(200, {"success": True, "images": images})
            return

        if parsed.path == "/ef-images":
            EF_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
            images = [
                item.name
                for item in sorted(EF_IMAGES_DIR.iterdir())
                if item.is_file() and item.suffix.lower() in ALLOWED_EXTENSIONS
            ]
            self._json_response(200, {"success": True, "images": images})
            return

        super().do_GET()


def run_server(port: int = 8000) -> None:
    server = ThreadingHTTPServer(("", port), UploadHandler)
    print(f"LAMSL server running at http://localhost:{port}/LASML.html")
    print("Upload endpoint active: POST /upload")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    run_server()
