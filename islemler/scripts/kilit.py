#!/usr/bin/env python3
"""
İşlem dosyası şifre kilidi.

Kullanım:
  python3 islemler/scripts/kilit.py set-password
  python3 islemler/scripts/kilit.py tamamla <dosya.md>
  python3 islemler/scripts/kilit.py unlock <dosya.md>
  python3 islemler/scripts/kilit.py kilitle <dosya.md>
  python3 islemler/scripts/kilit.py check <dosya.md>
  python3 islemler/scripts/kilit.py durum

Kilitli dosya değiştirilmeden önce unlock + doğru şifre gerekir.
"""

from __future__ import annotations

import argparse
import getpass
import hashlib
import hmac
import json
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]  # islemler/
HASH_FILE = ROOT / ".kilit-hash"
SESSION_FILE = ROOT / ".unlock-session.json"
SESSION_HOURS = 2

# İlk kurulum varsayılanı (set-password ile değiştirin)
DEFAULT_PASSWORD = "SuruYon2026!"


def hash_password(password: str, salt: str) -> str:
    return hashlib.sha256(f"{salt}:{password}".encode("utf-8")).hexdigest()


def load_hash() -> tuple[str, str]:
    if not HASH_FILE.exists():
        # İlk çalıştırmada varsayılan şifreyi yaz
        salt = hashlib.sha256(b"suruyon-islem-salt-v1").hexdigest()[:32]
        digest = hash_password(DEFAULT_PASSWORD, salt)
        HASH_FILE.write_text(json.dumps({"salt": salt, "hash": digest}, indent=2), encoding="utf-8")
        return salt, digest
    data = json.loads(HASH_FILE.read_text(encoding="utf-8"))
    return data["salt"], data["hash"]


def verify_password(password: str) -> bool:
    salt, digest = load_hash()
    return hmac.compare_digest(hash_password(password, salt), digest)


def ask_password(prompt: str = "İşlem kilidi şifresi: ") -> str:
    if not sys.stdin.isatty():
        # Agent/non-interactive: ortam değişkeni
        import os
        pw = os.environ.get("SURUYON_ISLEM_SIFRE", "")
        if not pw:
            print("HATA: Etkileşimsiz ortamda SURUYON_ISLEM_SIFRE gerekli.", file=sys.stderr)
            sys.exit(2)
        return pw
    return getpass.getpass(prompt)


def load_session() -> dict:
    if not SESSION_FILE.exists():
        return {"unlocked": {}, "expires": None}
    try:
        return json.loads(SESSION_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {"unlocked": {}, "expires": None}


def save_session(session: dict) -> None:
    SESSION_FILE.write_text(json.dumps(session, indent=2), encoding="utf-8")


def session_valid(session: dict) -> bool:
    exp = session.get("expires")
    if not exp:
        return False
    return datetime.now(timezone.utc) < datetime.fromisoformat(exp)


def ensure_session_password() -> dict:
    session = load_session()
    if session_valid(session) and session.get("auth"):
        return session
    pw = ask_password()
    if not verify_password(pw):
        print("HATA: Yanlış şifre.", file=sys.stderr)
        sys.exit(1)
    session["auth"] = True
    session["expires"] = (datetime.now(timezone.utc) + timedelta(hours=SESSION_HOURS)).isoformat()
    session.setdefault("unlocked", {})
    save_session(session)
    print(f"Oturum açıldı ({SESSION_HOURS} saat).")
    return session


def resolve_file(path: str) -> Path:
    p = Path(path)
    if not p.is_absolute():
        # islemler/ altından veya repo kökünden
        candidates = [ROOT / path, Path.cwd() / path, ROOT.parent / path]
        for c in candidates:
            if c.exists():
                return c.resolve()
        return (ROOT / path).resolve()
    return p.resolve()


def read_frontmatter(text: str) -> tuple[dict, str]:
    if not text.startswith("---"):
        return {}, text
    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}, text
    meta: dict = {}
    for line in parts[1].strip().splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip()
    return meta, parts[2]


def write_frontmatter(meta: dict, body: str) -> str:
    lines = ["---"]
    for k, v in meta.items():
        lines.append(f"{k}: {v}")
    lines.append("---")
    return "\n".join(lines) + body


def is_locked(meta: dict) -> bool:
    return meta.get("kilitli", "").lower() in ("true", "yes", "1") or meta.get("status", "").upper() == "DONE"


def cmd_set_password(_: argparse.Namespace) -> None:
    pw1 = ask_password("Yeni şifre: ")
    pw2 = ask_password("Tekrar: ")
    if pw1 != pw2:
        print("HATA: Şifreler uyuşmuyor.", file=sys.stderr)
        sys.exit(1)
    if len(pw1) < 6:
        print("HATA: En az 6 karakter.", file=sys.stderr)
        sys.exit(1)
    salt = hashlib.sha256(f"suruyon-{datetime.now(timezone.utc).isoformat()}".encode()).hexdigest()[:32]
    digest = hash_password(pw1, salt)
    HASH_FILE.write_text(json.dumps({"salt": salt, "hash": digest}, indent=2), encoding="utf-8")
    # oturumu sıfırla
    if SESSION_FILE.exists():
        SESSION_FILE.unlink()
    print("Şifre güncellendi. Hash:", HASH_FILE)


def cmd_tamamla(args: argparse.Namespace) -> None:
    ensure_session_password()
    path = resolve_file(args.dosya)
    if not path.exists():
        print(f"HATA: Dosya yok: {path}", file=sys.stderr)
        sys.exit(1)
    text = path.read_text(encoding="utf-8")
    meta, body = read_frontmatter(text)
    meta["status"] = "DONE"
    meta["kilitli"] = "true"
    meta["kilit_tarihi"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    # Başlığı [x] yap
    body2 = re.sub(r"^# \[ \] ", "# [x] ", body, count=1, flags=re.M)
    body2 = re.sub(r"^# (?!\[)", "# [x] ", body2, count=1, flags=re.M) if body2 == body else body2
    if "**KİLİTLİ" not in body2 and "KİLİTLİ — TAMAM" not in body2:
        # uyarı bloğu ekle
        insert = (
            "\n\n> **KİLİTLİ — TAMAM (şifre korumalı).** "
            "Değiştirmek için: `python3 islemler/scripts/kilit.py unlock <dosya>` + şifre.\n"
        )
        # ilk başlıktan sonra
        body2 = re.sub(r"(^# .+\n)", r"\1" + insert, body2, count=1, flags=re.M)
    path.write_text(write_frontmatter(meta, body2), encoding="utf-8")
    rel = path.relative_to(ROOT) if path.is_relative_to(ROOT) else path
    print(f"TAMAM + KİLİT: {rel}")
    # Her tamamlanan iş için hemen HTML rapor
    try:
        import subprocess
        # path zaten absolute; html_rapor one için repo-relative tercih et
        try:
            arg = str(path.relative_to(ROOT.parent))
        except ValueError:
            arg = str(path)
        subprocess.run(
            [sys.executable, str(ROOT / "scripts" / "html_rapor.py"), "one", arg],
            check=False,
        )
        print("HTML rapor paneli güncellendi: islemler/rapor/index.html")
    except Exception as e:
        print(f"HTML uyarı: {e}", file=sys.stderr)


def cmd_unlock(args: argparse.Namespace) -> None:
    session = ensure_session_password()
    path = resolve_file(args.dosya)
    if not path.exists():
        print(f"HATA: Dosya yok: {path}", file=sys.stderr)
        sys.exit(1)
    text = path.read_text(encoding="utf-8")
    meta, body = read_frontmatter(text)
    if not is_locked(meta):
        print("Dosya zaten kilitli değil.")
        return
    meta["kilitli"] = "false"
    meta["status"] = "DONE"  # tamam bilgisi kalır; sadece düzenleme açılır
    meta["gecici_acik"] = "true"
    rel = str(path.resolve())
    session["unlocked"][rel] = datetime.now(timezone.utc).isoformat()
    save_session(session)
    # uyarı
    if "GEÇİCİ AÇIK" not in body:
        body = re.sub(
            r"(^# .+\n)",
            r"\1\n> ⚠️ **GEÇİCİ AÇIK** — düzenleme sonrası `kilitle` çalıştırın.\n",
            body,
            count=1,
            flags=re.M,
        )
    path.write_text(write_frontmatter(meta, body), encoding="utf-8")
    print(f"AÇILDI (şifre OK): {path}")
    print("Bitince: python3 islemler/scripts/kilit.py kilitle", args.dosya)


def cmd_kilitle(args: argparse.Namespace) -> None:
    ensure_session_password()
    path = resolve_file(args.dosya)
    if not path.exists():
        print(f"HATA: Dosya yok: {path}", file=sys.stderr)
        sys.exit(1)
    text = path.read_text(encoding="utf-8")
    meta, body = read_frontmatter(text)
    meta["kilitli"] = "true"
    meta["status"] = meta.get("status", "DONE")
    meta.pop("gecici_acik", None)
    body = re.sub(r"\n> ⚠️ \*\*GEÇİCİ AÇIK\*\*.*\n", "\n", body)
    path.write_text(write_frontmatter(meta, body), encoding="utf-8")
    session = load_session()
    session.get("unlocked", {}).pop(str(path.resolve()), None)
    save_session(session)
    print(f"KİLİTLENDİ: {path}")
    try:
        import subprocess
        subprocess.run(
            [sys.executable, str(ROOT / "scripts" / "html_rapor.py"), "one", str(path)],
            check=False,
        )
    except Exception:
        pass


def cmd_check(args: argparse.Namespace) -> None:
    path = resolve_file(args.dosya)
    if not path.exists():
        print("YOK")
        sys.exit(1)
    text = path.read_text(encoding="utf-8")
    meta, _ = read_frontmatter(text)
    session = load_session()
    unlocked = session_valid(session) and str(path.resolve()) in session.get("unlocked", {})
    locked = is_locked(meta) and meta.get("kilitli", "").lower() == "true"
    if locked and not unlocked:
        print("KILITLI — düzenlemek için unlock + şifre")
        sys.exit(3)
    if locked and unlocked:
        print("GECICI_ACIK")
        sys.exit(0)
    print("ACIK")
    sys.exit(0)


def cmd_durum(_: argparse.Namespace) -> None:
    load_hash()
    locked = unlocked = todo = 0
    for f in ROOT.rglob("*.md"):
        if f.name in ("INDEX.md", "README.md") or "scripts" in f.parts:
            continue
        text = f.read_text(encoding="utf-8")
        meta, _ = read_frontmatter(text)
        st = meta.get("status", "").upper()
        if st == "TODO" or meta.get("kilitli", "").lower() == "false" and st != "DONE":
            if st == "TODO":
                todo += 1
            elif meta.get("gecici_acik") == "true":
                unlocked += 1
            else:
                todo += 1
        elif meta.get("kilitli", "").lower() == "true" or st == "DONE":
            if meta.get("gecici_acik") == "true":
                unlocked += 1
            else:
                locked += 1
    print(f"Kilitli: {locked}")
    print(f"Geçici açık: {unlocked}")
    print(f"TODO: {todo}")
    print(f"Hash dosyası: {HASH_FILE.exists()}")
    print(f"Varsayılan şifre (değiştirilmediyse): {DEFAULT_PASSWORD}")
    print("Şifre değiştir: python3 islemler/scripts/kilit.py set-password")


def main() -> None:
    parser = argparse.ArgumentParser(description="SürüYön işlem şifre kilidi")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("set-password", help="Kilit şifresini belirle/değiştir")
    p.set_defaults(func=cmd_set_password)

    p = sub.add_parser("tamamla", help="İşlemi tamamla ve kilitle")
    p.add_argument("dosya")
    p.set_defaults(func=cmd_tamamla)

    p = sub.add_parser("unlock", help="Şifre ile geçici aç")
    p.add_argument("dosya")
    p.set_defaults(func=cmd_unlock)

    p = sub.add_parser("kilitle", help="Tekrar kilitle")
    p.add_argument("dosya")
    p.set_defaults(func=cmd_kilitle)

    p = sub.add_parser("check", help="Dosya düzenlenebilir mi?")
    p.add_argument("dosya")
    p.set_defaults(func=cmd_check)

    p = sub.add_parser("durum", help="Özet")
    p.set_defaults(func=cmd_durum)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
