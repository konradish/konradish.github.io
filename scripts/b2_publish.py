#!/usr/bin/env python3
"""
b2_publish.py -- host-side publisher for Bridge-2 essays.

Bridge-2 (jailed, no git, no network) drops a finished post as Markdown into
    /home/kodell/bridge-container/home/output/publish/<slug>.md
with publish.py frontmatter (title, date, tags, excerpt; author defaults to Bridge-2).
Images go in a sibling folder named after the slug.

This script runs from the HOST cron. For each inbox file it:
  1. parses the frontmatter and refuses anything malformed
  2. scans the Markdown for secrets (gitleaks) and PII (regexes + an out-of-repo deny list)
  3. renders it with publish.py into a clean checkout of master
  4. scans the rendered HTML and the full diff again
  5. commits as Bridge-2 and pushes master (GitHub Pages deploys)
  6. moves the source to publish/published/ (or publish/rejected/ with a .reason.txt)
  7. posts one line to the #bridge chat channel either way

Fail closed: any scanner hit, any parse error, any git error -> rejected, nothing pushed.
The deny list lives OUTSIDE every git repo on purpose (it is itself PII):
    ~/.config/site-publish/deny-terms.txt   (one term per line, # comments)

Usage:
    uv run scripts/b2_publish.py            # process the inbox
    uv run scripts/b2_publish.py --dry-run  # scan + render, no commit/push/move
    uv run scripts/b2_publish.py --selftest # known-nonzero: planted secret + PII must be caught
"""
# /// script
# requires-python = ">=3.10"
# dependencies = ["pyyaml>=6.0", "markdown>=3.5"]
# ///
from __future__ import annotations

import argparse
import fcntl
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

import yaml

HOME = Path.home()
INBOX = HOME / "bridge-container/home/output/publish"
PUBLISHED = INBOX / "published"
REJECTED = INBOX / "rejected"
SITE_DIR = HOME / "src/konradish.github.io-publish"        # dedicated checkout of master
SITE_REMOTE = "https://github.com/konradish/konradish.github.io.git"
DENY_FILE = HOME / ".config/site-publish/deny-terms.txt"
LOG = HOME / "data/logs/b2-publish.log"
LOCK = HOME / ".config/site-publish/.lock"
CHAT_URL = "http://127.0.0.1:8772/call"
CHAT_CHANNEL = "bridge"
CHAT_FROM = "site-publisher"
SITE_URL = "https://konradodell.com"
AUTHOR = "Bridge-2 <bridge-2@konradodell.com>"
ALLOWED_EMAILS = {"contact@konradodell.com", "me@konradodell.com", "bridge-2@konradodell.com"}

# --- PII patterns (fail closed; a false positive costs one human look) ---------------
PII_PATTERNS = {
    "phone": re.compile(r"(?<!\d)\(?\d{3}\)?[-. ]\d{3}[-. ]\d{4}(?!\d)"),
    "ssn": re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),
    "email": re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b"),
    "private-ipv4": re.compile(r"\b(?:10|192\.168|172\.(?:1[6-9]|2\d|3[01]))\.\d{1,3}(?:\.\d{1,3}){1,2}\b"),
    "tailscale-ipv4": re.compile(r"\b100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}\b"),
    "lan-host": re.compile(r"\b[\w-]+\.(?:lan|local|localhost)\b", re.I),
    "street-address": re.compile(r"\b\d{2,5}\s+(?:[A-Z][a-z]+\s){1,3}(?:Ln|Lane|St|Street|Dr|Drive|Rd|Road|Ct|Court|Ave|Avenue|Blvd|Cir|Circle|Way|Trl|Trail)\b"),
    "home-path": re.compile(r"/home/[a-z][\w-]*/"),
}


def log(msg: str) -> None:
    line = f"{datetime.now().isoformat(timespec='seconds')} {msg}"
    print(line)
    LOG.parent.mkdir(parents=True, exist_ok=True)
    with LOG.open("a") as f:
        f.write(line + "\n")


def load_deny_terms() -> list[str]:
    if not DENY_FILE.exists():
        raise SystemExit(f"deny list missing: {DENY_FILE} -- refusing to publish without it")
    terms = [ln.strip() for ln in DENY_FILE.read_text().splitlines()]
    return [t for t in terms if t and not t.startswith("#")]


def pii_scan(text: str, deny_terms: list[str], label: str) -> list[str]:
    reasons: list[str] = []
    for name, rx in PII_PATTERNS.items():
        for m in rx.finditer(text):
            hit = m.group(0)
            if name == "email" and hit.lower() in ALLOWED_EMAILS:
                continue
            reasons.append(f"{label}: {name} -> {hit!r}")
    for term in deny_terms:
        if re.search(rf"(?<![\w-]){re.escape(term)}(?![\w-])", text, re.I):
            reasons.append(f"{label}: deny-term -> {term!r}")
    return reasons


def gitleaks_scan(path: Path, label: str) -> list[str]:
    """Run gitleaks over a directory or file. Returns reasons (empty = clean)."""
    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tf:
        report = Path(tf.name)
    try:
        r = subprocess.run(
            ["gitleaks", "dir", str(path), "--no-banner", "--redact", "--exit-code", "0", "-r", str(report)],
            capture_output=True, text=True, timeout=120,
        )
        if r.returncode != 0:
            return [f"{label}: gitleaks failed to run (rc={r.returncode}): {r.stderr.strip()[:200]}"]
        findings = json.loads(report.read_text() or "[]")
        return [f"{label}: gitleaks {f.get('RuleID')} in {f.get('File')}:{f.get('StartLine')}" for f in findings]
    finally:
        report.unlink(missing_ok=True)


def sh(args: list[str], cwd: Path | None = None) -> str:
    r = subprocess.run(args, cwd=cwd, capture_output=True, text=True, timeout=300)
    if r.returncode != 0:
        raise RuntimeError(f"{' '.join(args)} -> rc={r.returncode}: {r.stderr.strip()[:400]}")
    return r.stdout


def ensure_site_checkout() -> None:
    if not (SITE_DIR / ".git").exists():
        SITE_DIR.parent.mkdir(parents=True, exist_ok=True)
        sh(["git", "clone", "-q", "--branch", "master", SITE_REMOTE, str(SITE_DIR)])
    sh(["git", "fetch", "-q", "origin", "master"], cwd=SITE_DIR)
    sh(["git", "checkout", "-q", "master"], cwd=SITE_DIR)
    sh(["git", "reset", "-q", "--hard", "origin/master"], cwd=SITE_DIR)
    sh(["git", "clean", "-qfd"], cwd=SITE_DIR)


def chat(body: str) -> None:
    try:
        payload = json.dumps({"name": "chat__send", "arguments": {"from": CHAT_FROM, "channel": CHAT_CHANNEL, "body": body}}).encode()
        req = urllib.request.Request(CHAT_URL, data=payload, headers={"Content-Type": "application/json"})
        urllib.request.urlopen(req, timeout=10).read()
    except Exception as e:  # chat is best-effort; the log is the record
        log(f"chat post failed: {e}")


def parse_frontmatter(text: str) -> dict:
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n", text, re.S)
    if not m:
        raise ValueError("no YAML frontmatter")
    fm = yaml.safe_load(m.group(1)) or {}
    for k in ("title", "date", "excerpt"):
        if not fm.get(k):
            raise ValueError(f"frontmatter missing '{k}'")
    return fm


def reject(md: Path, reasons: list[str], dry_run: bool) -> None:
    log(f"REJECT {md.name}: {len(reasons)} reason(s)")
    for r in reasons:
        log(f"   - {r}")
    if dry_run:
        return
    REJECTED.mkdir(parents=True, exist_ok=True)
    dest = REJECTED / md.name
    shutil.move(str(md), dest)
    img = md.parent / md.stem
    if img.is_dir():
        shutil.move(str(img), REJECTED / md.stem)
    (REJECTED / f"{md.stem}.reason.txt").write_text("\n".join(reasons) + "\n")
    chat(f"[site-publisher] REJECTED {md.name}: {len(reasons)} scanner hit(s). Reasons in output/publish/rejected/{md.stem}.reason.txt. Nothing was pushed. Fix and re-drop the file.")


def process(md: Path, deny_terms: list[str], dry_run: bool) -> bool:
    text = md.read_text()
    try:
        fm = parse_frontmatter(text)
    except Exception as e:
        reject(md, [f"frontmatter: {e}"], dry_run)
        return False
    slug = fm.get("slug") or md.stem
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]{2,80}", slug):
        reject(md, [f"slug {slug!r} must be lowercase-kebab"], dry_run)
        return False

    # Pass 1: the source
    reasons = pii_scan(text, deny_terms, "markdown")
    with tempfile.TemporaryDirectory() as td:
        shutil.copy(md, Path(td) / md.name)
        img = md.parent / slug
        if img.is_dir():
            shutil.copytree(img, Path(td) / slug)
        reasons += gitleaks_scan(Path(td), "source")
    if reasons:
        reject(md, reasons, dry_run)
        return False

    # Render into a clean master
    try:
        ensure_site_checkout()
        stamped = md
        if not fm.get("author"):
            # publish.py reads author from frontmatter; default it without touching B2's file
            stamped = Path(tempfile.mkdtemp()) / md.name
            stamped.write_text(text.replace("---\n", "---\nauthor: Bridge-2\n", 1))
            if (md.parent / slug).is_dir():
                shutil.copytree(md.parent / slug, stamped.parent / slug)
        sh(["uv", "run", str(SITE_DIR / "publish.py"), str(stamped), "--site-dir", str(SITE_DIR)], cwd=SITE_DIR)
    except Exception as e:
        reject(md, [f"render: {e}"], dry_run)
        return False

    # Pass 2: what would actually ship
    reasons = []
    for p in [SITE_DIR / "blog" / f"{slug}.html", SITE_DIR / "blog.html"]:
        reasons += pii_scan(p.read_text(), deny_terms, p.name)
    reasons += gitleaks_scan(SITE_DIR / "blog", "rendered")
    diff = sh(["git", "status", "--porcelain"], cwd=SITE_DIR).splitlines()
    unexpected = [l for l in diff if not (l.endswith("blog.html") or f"blog/{slug}" in l)]
    if unexpected:
        reasons.append(f"render touched unexpected paths: {unexpected}")
    if reasons:
        sh(["git", "reset", "-q", "--hard", "origin/master"], cwd=SITE_DIR)
        sh(["git", "clean", "-qfd"], cwd=SITE_DIR)
        reject(md, reasons, dry_run)
        return False

    if dry_run:
        log(f"DRY-RUN OK {md.name} -> blog/{slug}.html (clean; not committed)")
        sh(["git", "reset", "-q", "--hard", "origin/master"], cwd=SITE_DIR)
        sh(["git", "clean", "-qfd"], cwd=SITE_DIR)
        return True

    # Commit as Bridge-2 and push
    try:
        sh(["git", "add", "blog.html", f"blog/{slug}.html"], cwd=SITE_DIR)
        if (SITE_DIR / "blog" / slug).is_dir():
            sh(["git", "add", f"blog/{slug}"], cwd=SITE_DIR)
        msg = f"Bridge-2 essay: {fm['title']}\n\nPublished by scripts/b2_publish.py after gitleaks + PII scan."
        sh(["git", "-c", "user.name=Bridge-2", "-c", "user.email=bridge-2@konradodell.com",
            "commit", "-q", "--author", AUTHOR, "-m", msg], cwd=SITE_DIR)
        sh(["git", "push", "-q", "origin", "master"], cwd=SITE_DIR)
    except Exception as e:
        sh(["git", "reset", "-q", "--hard", "origin/master"], cwd=SITE_DIR)
        reject(md, [f"git: {e}"], dry_run)
        return False

    PUBLISHED.mkdir(parents=True, exist_ok=True)
    shutil.move(str(md), PUBLISHED / md.name)
    if (md.parent / slug).is_dir():
        shutil.move(str(md.parent / slug), PUBLISHED / slug)
    url = f"{SITE_URL}/blog/{slug}.html"
    log(f"PUBLISHED {md.name} -> {url}")
    chat(f"[site-publisher] PUBLISHED \"{fm['title']}\" -> {url} (live within ~1 min). Source moved to output/publish/published/.")
    return True


def selftest() -> int:
    deny = ["Plantedname"]
    bad = ("---\ntitle: t\ndate: 2026-01-01\nexcerpt: e\n---\n"
           "Call me at 469-555-0100 or mail hidden@example.org. Host tower.lan at 192.168.1.5. "
           "Plantedname lives at 1512 Some Street Ln. A token: ghp_" + "".join(__import__("random").choices("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", k=36)) + ".")
    reasons = pii_scan(bad, deny, "selftest")
    kinds = {r.split(": ")[1].split(" ->")[0] for r in reasons}
    want = {"phone", "email", "lan-host", "private-ipv4", "street-address", "deny-term"}
    with tempfile.TemporaryDirectory() as td:
        (Path(td) / "x.md").write_text(bad)
        gl = gitleaks_scan(Path(td), "selftest")
    ok = want <= kinds and len(gl) >= 1
    print(f"pii kinds caught: {sorted(kinds)}  gitleaks findings: {len(gl)}  -> {'PASS' if ok else 'FAIL'}")
    clean = pii_scan("A clean paragraph about certificate revocation and contact@konradodell.com.", deny, "clean")
    print(f"clean text false positives: {clean or 'none'}")
    return 0 if ok and not clean else 1


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--selftest", action="store_true")
    args = ap.parse_args()
    if args.selftest:
        return selftest()
    LOCK.parent.mkdir(parents=True, exist_ok=True)
    with LOCK.open("w") as lf:
        try:
            fcntl.flock(lf, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            log("another run holds the lock; exiting")
            return 0
        deny_terms = load_deny_terms()
        INBOX.mkdir(parents=True, exist_ok=True)
        inbox = sorted(p for p in INBOX.glob("*.md"))
        if not inbox:
            return 0
        log(f"inbox: {len(inbox)} file(s){' (dry-run)' if args.dry_run else ''}")
        rc = 0
        for md in inbox:
            try:
                if not process(md, deny_terms, args.dry_run):
                    rc = 1
            except Exception as e:
                log(f"ERROR {md.name}: {e}")
                rc = 1
        return rc


if __name__ == "__main__":
    sys.exit(main())
