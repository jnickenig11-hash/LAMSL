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
SLIDESHOW_META_FILE = BASE_DIR / "slideshow_metadata.json"
EF_META_FILE = BASE_DIR / "ef_images_metadata.json"
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


def _read_metadata(path: Path) -> dict[str, dict]:
    if not path.exists():
        return {}

    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}

    if not isinstance(raw, dict):
        return {}

    normalized = {}
    for filename, value in raw.items():
        if isinstance(value, dict):
            normalized[str(filename)] = {"caption": str(value.get("caption", "")).strip()}
        else:
            normalized[str(filename)] = {"caption": str(value).strip()}
    return normalized


def _write_metadata(path: Path, metadata: dict[str, dict]) -> None:
    path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")


def _sanitize_caption(value: str | None) -> str:
    return (value or "").strip()[:180]


def _build_image_payload(directory: Path, metadata_path: Path, url_prefix: str) -> list[dict]:
    directory.mkdir(parents=True, exist_ok=True)
    metadata = _read_metadata(metadata_path)
    items = []

    for item in sorted(directory.iterdir()):
        if not item.is_file() or item.suffix.lower() not in ALLOWED_EXTENSIONS:
            continue
        items.append(
            {
                "name": item.name,
                "path": f"{url_prefix}/{item.name}",
                "caption": metadata.get(item.name, {}).get("caption", ""),
            }
        )

    return items


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
            self._handle_upload(SLIDESHOW_DIR, "SlideshowImages", SLIDESHOW_META_FILE)
        elif parsed.path == "/upload-ef":
            self._handle_upload(EF_IMAGES_DIR, "EF_Images", EF_META_FILE)
        elif parsed.path == "/remove-photo":
            self._handle_remove_photo(SLIDESHOW_DIR, SLIDESHOW_META_FILE)
        elif parsed.path == "/remove-ef-photo":
            self._handle_remove_photo(EF_IMAGES_DIR, EF_META_FILE)
        else:
            self._json_response(404, {"success": False, "error": "Not found"})

    def _handle_upload(self, target_dir: Path, url_prefix: str, metadata_path: Path) -> None:
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
        caption = ""
        if message.is_multipart():
            for part in message.iter_parts():
                name = part.get_param("name", header="Content-Disposition")
                if name == "photo":
                    photo_part = part
                elif name == "caption":
                    caption = _sanitize_caption(part.get_content())

        if photo_part is None:
            self._json_response(400, {"success": False, "error": "No photo file uploaded"})
            return

        raw_filename = photo_part.get_filename() or "upload.jpg"
        safe_name = _safe_filename(raw_filename)

        target_dir.mkdir(parents=True, exist_ok=True)
        destination = _unique_path(target_dir, safe_name)
        payload = photo_part.get_payload(decode=True) or b""
        destination.write_bytes(payload)

        metadata = _read_metadata(metadata_path)
        metadata[destination.name] = {"caption": caption}
        _write_metadata(metadata_path, metadata)

        self._json_response(
            200,
            {
                "success": True,
                "filename": destination.name,
                "path": f"{url_prefix}/{destination.name}",
                "caption": caption,
            },
        )

    def _handle_remove_photo(self, target_dir: Path, metadata_path: Path) -> None:
        content_length = int(self.headers.get("Content-Length", "0"))
        if content_length <= 0:
            self._json_response(400, {"success": False, "error": "Invalid request body"})
            return

        try:
            payload = json.loads(self.rfile.read(content_length).decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            self._json_response(400, {"success": False, "error": "Invalid JSON body"})
            return

        filename = str(payload.get("filename", "")).strip()
        if not filename:
            self._json_response(400, {"success": False, "error": "Missing filename"})
            return

        safe_name = Path(filename).name
        if safe_name != filename:
            self._json_response(400, {"success": False, "error": "Invalid filename"})
            return

        target = target_dir / safe_name
        if not target.exists() or not target.is_file():
            self._json_response(404, {"success": False, "error": "Photo not found"})
            return

        try:
            target.unlink()
        except OSError:
            self._json_response(500, {"success": False, "error": "Failed to remove photo"})
            return

        metadata = _read_metadata(metadata_path)
        if safe_name in metadata:
            metadata.pop(safe_name, None)
            _write_metadata(metadata_path, metadata)

        self._json_response(200, {"success": True, "filename": safe_name})

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/slideshow-images":
            images = _build_image_payload(SLIDESHOW_DIR, SLIDESHOW_META_FILE, "SlideshowImages")
            self._json_response(200, {"success": True, "images": images})
            return

        if parsed.path == "/ef-images":
            images = _build_image_payload(EF_IMAGES_DIR, EF_META_FILE, "EF_Images")
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
