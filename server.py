import json
import re
from email.parser import BytesParser
from email.policy import default
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, quote, urlparse

BASE_DIR = Path(__file__).resolve().parent
SLIDESHOW_DIR = BASE_DIR / "SlideshowImages"
EF_IMAGES_DIR = BASE_DIR / "EF_Images"
TEAM_PROFILE_DIR = BASE_DIR / "teamProfile images"
SLIDESHOW_META_FILE = BASE_DIR / "slideshow_metadata.json"
EF_META_FILE = BASE_DIR / "ef_images_metadata.json"
TEAM_PROFILE_META_FILE = BASE_DIR / "team_profile_metadata.json"
ALLOWED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".bmp",
    ".svg",
    ".apng",
    ".avif",
    ".ico",
    ".jfif",
    ".tif",
    ".tiff",
    ".heic",
    ".heif",
}

CONTENT_TYPE_EXTENSION_MAP = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/bmp": ".bmp",
    "image/svg+xml": ".svg",
    "image/apng": ".apng",
    "image/avif": ".avif",
    "image/x-icon": ".ico",
    "image/vnd.microsoft.icon": ".ico",
    "image/tiff": ".tif",
    "image/heic": ".heic",
    "image/heif": ".heif",
}


def _safe_filename(filename: str, content_type: str | None = None) -> str:
    cleaned = Path(filename).name
    cleaned = re.sub(r"[^A-Za-z0-9._() -]", "_", cleaned)
    if not cleaned:
        inferred = CONTENT_TYPE_EXTENSION_MAP.get((content_type or "").lower(), ".jpg")
        cleaned = f"upload{inferred}"

    extension = Path(cleaned).suffix.lower()
    if extension:
        return cleaned

    inferred_extension = CONTENT_TYPE_EXTENSION_MAP.get((content_type or "").lower(), ".jpg")
    cleaned = f"{Path(cleaned).stem}{inferred_extension}"

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
            normalized[str(filename)] = {str(key): str(inner_value).strip() for key, inner_value in value.items()}
            normalized[str(filename)].setdefault("caption", "")
        else:
            normalized[str(filename)] = {"caption": str(value).strip()}
    return normalized


def _write_metadata(path: Path, metadata: dict[str, dict]) -> None:
    path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")


def _sanitize_caption(value: str | None) -> str:
    return (value or "").strip()[:180]


def _sanitize_team_field(value: str | None) -> str:
    return re.sub(r"\s+", " ", (value or "").strip())[:80]


def _team_profile_division_folder(division: str) -> str:
    mapping = {
        "A": "Division A",
        "B": "Division B",
        "C": "Division C",
        "D": "Division D",
        "E": "Division E",
        "W1": "Winter Division 1",
        "W2": "Winter Division 2",
    }
    normalized = division.strip().upper()
    return mapping.get(normalized, f"Division {normalized}" if normalized else "Division NA")


def _team_profile_directory(team: str, division: str) -> Path:
    return TEAM_PROFILE_DIR / _team_profile_division_folder(division) / team


def _team_profile_web_path(division: str, team: str, filename: str) -> str:
    division_folder = quote(_team_profile_division_folder(division), safe="")
    team_folder = quote(team, safe="")
    file_name = quote(filename, safe="")
    return f"teamProfile%20images/{division_folder}/{team_folder}/{file_name}"


def _relative_team_profile_web_path(relative_path: str) -> str:
    parts = [quote(part, safe="") for part in Path(relative_path).as_posix().split("/") if part]
    return "teamProfile%20images/" + "/".join(parts)


def _team_profile_key(team: str, division: str) -> str:
    safe_team = re.sub(r"[^A-Za-z0-9]+", "-", team.strip().lower()).strip("-") or "team"
    safe_division = re.sub(r"[^A-Za-z0-9]+", "-", division.strip().upper()).strip("-") or "NA"
    return f"{safe_division}__{safe_team}"


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
        route = parsed.path.rstrip("/") or "/"
        if route == "/upload":
            self._handle_upload(SLIDESHOW_DIR, "SlideshowImages", SLIDESHOW_META_FILE)
        elif route == "/upload-ef":
            self._handle_upload(EF_IMAGES_DIR, "EF_Images", EF_META_FILE)
        elif route == "/upload-team-photo":
            self._handle_team_photo_upload()
        elif route == "/remove-photo":
            self._handle_remove_photo(SLIDESHOW_DIR, SLIDESHOW_META_FILE)
        elif route == "/remove-ef-photo":
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
        safe_name = _safe_filename(raw_filename, photo_part.get_content_type())

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

    def _handle_team_photo_upload(self) -> None:
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
        team = ""
        division = ""
        if message.is_multipart():
            for part in message.iter_parts():
                name = part.get_param("name", header="Content-Disposition")
                if name == "photo":
                    photo_part = part
                elif name == "team":
                    team = _sanitize_team_field(part.get_content())
                elif name == "division":
                    division = _sanitize_team_field(part.get_content()).upper()

        if photo_part is None:
            self._json_response(400, {"success": False, "error": "No photo file uploaded"})
            return

        if not team or not division:
            self._json_response(400, {"success": False, "error": "Missing team or division"})
            return

        raw_filename = photo_part.get_filename() or "team-photo.jpg"
        safe_name = _safe_filename(raw_filename, photo_part.get_content_type())
        extension = Path(safe_name).suffix.lower() or ".jpg"
        profile_key = _team_profile_key(team, division)
        stored_name = f"profile{extension}"

        team_dir = _team_profile_directory(team, division)
        team_dir.mkdir(parents=True, exist_ok=True)
        metadata = _read_metadata(TEAM_PROFILE_META_FILE)
        existing = metadata.get(profile_key, {})
        # Keep exactly one image per team folder.
        for item in team_dir.iterdir():
            if item.is_file() and item.suffix.lower() in ALLOWED_EXTENSIONS:
                try:
                    item.unlink()
                except OSError:
                    pass

        old_relative_path = str(existing.get("relative_path", "")).strip()
        if old_relative_path:
            old_path = TEAM_PROFILE_DIR / Path(old_relative_path)
            if old_path.exists() and old_path.is_file() and old_path.parent != team_dir:
                try:
                    old_path.unlink()
                except OSError:
                    pass

        destination = team_dir / stored_name
        payload = photo_part.get_payload(decode=True) or b""
        destination.write_bytes(payload)

        relative_path = destination.relative_to(TEAM_PROFILE_DIR).as_posix()

        metadata[profile_key] = {
            "team": team,
            "division": division,
            "filename": destination.name,
            "relative_path": relative_path,
        }
        _write_metadata(TEAM_PROFILE_META_FILE, metadata)

        self._json_response(
            200,
            {
                "success": True,
                "team": team,
                "division": division,
                "filename": destination.name,
                "folder": str(team_dir.relative_to(TEAM_PROFILE_DIR).as_posix()),
                "path": _relative_team_profile_web_path(relative_path),
            },
        )

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        route = parsed.path.rstrip("/") or "/"
        if route == "/slideshow-images":
            images = _build_image_payload(SLIDESHOW_DIR, SLIDESHOW_META_FILE, "SlideshowImages")
            self._json_response(200, {"success": True, "images": images})
            return

        if route == "/ef-images":
            images = _build_image_payload(EF_IMAGES_DIR, EF_META_FILE, "EF_Images")
            self._json_response(200, {"success": True, "images": images})
            return

        if route == "/team-profile-photo":
            params = parse_qs(parsed.query)
            team = _sanitize_team_field((params.get("team") or [""])[0])
            division = _sanitize_team_field((params.get("division") or [""])[0]).upper()
            if not team or not division:
                self._json_response(400, {"success": False, "error": "Missing team or division"})
                return

            metadata = _read_metadata(TEAM_PROFILE_META_FILE)
            item = metadata.get(_team_profile_key(team, division))
            if not isinstance(item, dict) or not item.get("filename"):
                item = {"team": team, "division": division}
                team_dir = _team_profile_directory(team, division)
                fallback = None
                if team_dir.exists():
                    for candidate in sorted(team_dir.iterdir()):
                        if candidate.is_file() and candidate.suffix.lower() in ALLOWED_EXTENSIONS:
                            fallback = candidate
                            break
                if fallback is None:
                    self._json_response(200, {"success": True, "photo": None})
                    return
                filename = fallback.name
            else:
                filename = Path(str(item.get("filename", ""))).name

            relative_path = str(item.get("relative_path", "")).strip()
            if not relative_path:
                relative_path = f"{_team_profile_division_folder(division)}/{team}/{filename}"

            photo = {
                "team": str(item.get("team", team)),
                "division": str(item.get("division", division)),
                "filename": filename,
                "folder": str(Path(relative_path).parent.as_posix()),
                "path": _relative_team_profile_web_path(relative_path),
            }
            self._json_response(200, {"success": True, "photo": photo})
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
