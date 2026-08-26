#!/usr/bin/env python3
"""
İşlem → HTML rapor + şifre kilidi (tüm uygulamalarda kullanılabilir).

Kullanım (bu repoda):
  python3 islemler/scripts/html_rapor.py rebuild      # tüm HTML'leri yenile
  python3 islemler/scripts/html_rapor.py one <dosya>  # tek işlem HTML

Başka uygulamada:
  araclar/islem-kontrol/ klasörünü kopyalayın; ISLEMLER_DIR ayarlayın.
"""

from __future__ import annotations

import argparse
import html
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]  # islemler/
RAPOR = ROOT / "rapor"
APP_NAME = "SürüYön"


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


def iter_islem_files() -> list[Path]:
    files = []
    for f in sorted(ROOT.rglob("*.md")):
        if f.name in ("INDEX.md", "README.md"):
            continue
        if "scripts" in f.parts or "rapor" in f.parts:
            continue
        files.append(f)
    return files


def title_from_body(body: str, fallback: str) -> str:
    m = re.search(r"^#\s+(?:\[.\]\s*)?(.+)$", body, re.M)
    return m.group(1).strip() if m else fallback


def status_of(meta: dict) -> str:
    if meta.get("gecici_acik") == "true":
        return "GECICI_ACIK"
    if meta.get("kilitli", "").lower() == "true" or meta.get("status", "").upper() == "DONE":
        return "KILITLI"
    return "TODO"


def html_page(title: str, body_inner: str, locked: bool) -> str:
    badge = (
        '<span class="badge lock">🔒 KİLİTLİ — şifresiz değiştirilemez</span>'
        if locked
        else '<span class="badge todo">AÇIK İŞLEM</span>'
    )
    return f"""<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{html.escape(title)} — {APP_NAME} İşlem Raporu</title>
  <style>
    :root {{
      --bg: #f4f7f0;
      --card: #fff;
      --text: #1a2e1a;
      --muted: #4a5f4a;
      --tint: #2d6a4f;
      --lock: #c1121f;
      --ok: #2d6a4f;
      --border: #d8e2d0;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0; font-family: "Segoe UI", system-ui, sans-serif;
      background: linear-gradient(160deg, #e8f0e4, var(--bg) 40%, #eef5ea);
      color: var(--text); line-height: 1.5; min-height: 100vh;
    }}
    header {{
      background: var(--tint); color: #fff; padding: 1.25rem 1.5rem;
    }}
    header a {{ color: #c8f0d8; }}
    main {{ max-width: 820px; margin: 1.5rem auto; padding: 0 1rem 3rem; }}
    .card {{
      background: var(--card); border: 1px solid var(--border);
      border-radius: 14px; padding: 1.25rem 1.5rem; margin-bottom: 1rem;
      box-shadow: 0 8px 24px rgba(45,106,79,.06);
    }}
    .badge {{
      display: inline-block; padding: .35rem .7rem; border-radius: 999px;
      font-size: .8rem; font-weight: 700;
    }}
    .badge.lock {{ background: #ffe5e5; color: var(--lock); }}
    .badge.todo {{ background: #e8f5e9; color: var(--ok); }}
    .badge.open {{ background: #fff3cd; color: #856404; }}
    h1 {{ margin: .5rem 0 0; font-size: 1.45rem; }}
    pre, code {{ font-family: ui-monospace, monospace; font-size: .85rem; }}
    pre {{
      background: #1a241a; color: #e8f0e8; padding: 1rem; border-radius: 10px;
      overflow-x: auto;
    }}
    .meta {{ color: var(--muted); font-size: .9rem; }}
    table {{ width: 100%; border-collapse: collapse; }}
    th, td {{ text-align: left; padding: .55rem .4rem; border-bottom: 1px solid var(--border); }}
    th {{ color: var(--muted); font-size: .8rem; }}
    .cmd {{ background: #f0f5ee; padding: .75rem 1rem; border-radius: 10px; }}
  </style>
</head>
<body>
  <header>
    <div><strong>{html.escape(APP_NAME)}</strong> · İşlem Kontrol Raporu</div>
    <div style="opacity:.85;font-size:.9rem;margin-top:.25rem">
      <a href="index.html">← Tüm işlemler paneli</a>
    </div>
  </header>
  <main>
    <div class="card">
      {badge}
      <h1>{html.escape(title)}</h1>
      <p class="meta">Oluşturulma: {datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")}</p>
    </div>
    {body_inner}
  </main>
</body>
</html>
"""


def write_one(md_path: Path) -> Path | None:
    text = md_path.read_text(encoding="utf-8")
    meta, body = read_frontmatter(text)
    st = status_of(meta)
    title = title_from_body(body, md_path.stem)
    rel = md_path.relative_to(ROOT).as_posix()
    locked = st == "KILITLI"

    # sadece DONE/KILITLI ve GECICI için HTML üret; TODO için de hafif sayfa
    notes = []
    for line in body.splitlines():
        if line.startswith("## Ne yapıldı") or line.startswith("## Yapılacak"):
            notes.append(f"<h2>{html.escape(line.lstrip('#').strip())}</h2>")
        elif line.startswith("**Kod") or line.startswith("**Klasör") or line.startswith("**Bağımlı"):
            notes.append(f"<p>{html.escape(line)}</p>")
        elif line.startswith("> "):
            notes.append(f"<p><em>{html.escape(line[2:])}</em></p>")
        elif line.strip() and not line.startswith("#") and not line.startswith("---"):
            if line.startswith("- ") or not line.startswith("status"):
                notes.append(f"<p>{html.escape(line)}</p>")

    lock_block = ""
    if locked:
        lock_block = f"""
        <div class="card">
          <h2>Şifre kilidi</h2>
          <p>Bu işlem <strong>tamam</strong> olarak kilitlendi. İstemeden değişmesin diye şifre gerekir.</p>
          <div class="cmd">
            <pre>python3 islemler/scripts/kilit.py unlock {html.escape(rel)}
# şifre girin, düzenleyin, sonra:
python3 islemler/scripts/kilit.py kilitle {html.escape(rel)}</pre>
          </div>
        </div>"""
    elif st == "TODO":
        lock_block = f"""
        <div class="card">
          <h2>Tamamlama</h2>
          <div class="cmd">
            <pre>python3 islemler/scripts/kilit.py tamamla {html.escape(rel)}
# → HTML rapor üretilir + şifre kilidi konur</pre>
          </div>
        </div>"""

    inner = f"""
    <div class="card">
      <table>
        <tr><th>Durum</th><td>{html.escape(st)}</td></tr>
        <tr><th>Dosya</th><td><code>{html.escape(rel)}</code></td></tr>
        <tr><th>status</th><td>{html.escape(meta.get("status", "—"))}</td></tr>
        <tr><th>kilitli</th><td>{html.escape(meta.get("kilitli", "—"))}</td></tr>
      </table>
    </div>
    <div class="card">{"".join(notes) or "<p>Detay için markdown kaynağına bakın.</p>"}</div>
    {lock_block}
    """

    out_dir = RAPOR / md_path.parent.relative_to(ROOT)
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / (md_path.stem + ".html")
    out.write_text(html_page(title, inner, locked), encoding="utf-8")
    return out


def write_index(files: list[Path]) -> Path:
    rows = []
    n_lock = n_todo = n_open = 0
    for f in files:
        text = f.read_text(encoding="utf-8")
        meta, body = read_frontmatter(text)
        st = status_of(meta)
        title = title_from_body(body, f.stem)
        rel = f.relative_to(ROOT).as_posix()
        href = rel.replace(".md", ".html")
        if st == "KILITLI":
            n_lock += 1
            badge = '<span class="badge lock">🔒</span>'
        elif st == "GECICI_ACIK":
            n_open += 1
            badge = '<span class="badge open">⚠️</span>'
        else:
            n_todo += 1
            badge = '<span class="badge todo">[ ]</span>'
        rows.append(
            f"<tr><td>{badge}</td><td><a href=\"{html.escape(href)}\">{html.escape(title)}</a></td>"
            f"<td><code>{html.escape(rel)}</code></td><td>{html.escape(st)}</td></tr>"
        )

    inner = f"""
    <div class="card">
      <h1 style="margin-top:0">Kontrol Paneli</h1>
      <p class="meta">Her tamamlanan iş HTML olarak burada. Kilitli = şifresiz değişmez.</p>
      <p><strong>🔒 {n_lock}</strong> kilitli · <strong>[ ] {n_todo}</strong> açık · <strong>⚠️ {n_open}</strong> geçici</p>
    </div>
    <div class="card">
      <table>
        <thead><tr><th></th><th>İşlem</th><th>Dosya</th><th>Durum</th></tr></thead>
        <tbody>
          {''.join(rows)}
        </tbody>
      </table>
    </div>
    <div class="card">
      <h2>Kurallar (tüm uygulamalar)</h2>
      <ol>
        <li>Her iş = ayrı markdown dosyası</li>
        <li><strong>Tamam</strong> → HTML rapor + şifre kilidi</li>
        <li>Değişiklik → şifre ile <code>unlock</code> → düzenle → <code>kilitle</code></li>
        <li>İstemeden değişmesin diye agent kilitli dosyaya şifresiz yazmaz</li>
      </ol>
    </div>
    """
    RAPOR.mkdir(parents=True, exist_ok=True)
    out = RAPOR / "index.html"
    out.write_text(html_page("Kontrol Paneli", inner, False), encoding="utf-8")
    return out


def rebuild() -> None:
    files = iter_islem_files()
    for f in files:
        write_one(f)
    idx = write_index(files)
    print(f"{len(files)} HTML yazıldı. Panel: {idx}")


def main() -> None:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("rebuild").set_defaults(fn=lambda a: rebuild())
    p = sub.add_parser("one")
    p.add_argument("dosya")
    def one(a):
        raw = Path(a.dosya)
        candidates = [
            raw if raw.is_absolute() else None,
            Path.cwd() / a.dosya,
            ROOT / a.dosya,
            ROOT / Path(a.dosya).name,
        ]
        # islemler/ prefix tekrarını önle
        if str(a.dosya).startswith("islemler/"):
            candidates.insert(0, ROOT.parent / a.dosya)
        path = next((c for c in candidates if c and c.exists()), None)
        if not path:
            print(f"HATA: Dosya yok: {a.dosya}")
            raise SystemExit(1)
        out = write_one(path.resolve())
        write_index(iter_islem_files())
        print(out)
    p.set_defaults(fn=one)
    args = parser.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
