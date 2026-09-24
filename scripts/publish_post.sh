#!/usr/bin/env bash
# Publish one of my own blog posts: render, commit, push, and wait until it is live.
#
#   scripts/publish_post.sh path/to/post.md            # publish
#   scripts/publish_post.sh path/to/post.md --dry-run  # preview only, touches nothing
#
# The post is Markdown with frontmatter (see publish.py). Leave `author` out:
# posts without an author land under "My posts" on blog.html and at the top of
# the homepage Writing list. Keep drafts outside this repo (it is public).
set -euo pipefail

post="${1:?usage: scripts/publish_post.sh path/to/post.md [--dry-run]}"
repo="$(cd "$(dirname "$0")/.." && pwd)"
post="$(realpath "$post")"

if [[ "${2:-}" == "--dry-run" ]]; then
  uv run -q "$repo/publish.py" "$post" --site-dir "$repo" --dry-run
  exit 0
fi

if grep -qE '^author:' <(sed -n '/^---$/,/^---$/p' "$post"); then
  echo "Frontmatter has an author: field; own posts should leave it out." >&2
  exit 1
fi

git -C "$repo" fetch -q origin
git -C "$repo" merge -q --ff-only origin/master
if [[ -n "$(git -C "$repo" status --porcelain -- blog.html index.html blog)" ]]; then
  echo "blog.html, index.html or blog/ already has uncommitted changes; sort those out first." >&2
  exit 1
fi

uv run -q "$repo/publish.py" "$post" --site-dir "$repo"

slug="$(sed -n '/^---$/,/^---$/p' "$post" | sed -n 's/^slug:[[:space:]]*//p' | tr -d '"'"'"'')"
slug="${slug:-$(basename "$post" .md)}"
title="$(sed -n '/^---$/,/^---$/p' "$post" | sed -n 's/^title:[[:space:]]*//p' | tr -d '"')"

paths=(blog.html index.html "blog/$slug.html")
[[ -d "$repo/blog/$slug" ]] && paths+=("blog/$slug")
git -C "$repo" add -- "${paths[@]}"
git -C "$repo" diff --cached --stat
git -C "$repo" commit -q -m "Post: $title"
git -C "$repo" push -q origin HEAD:master

url="https://konradodell.com/blog/$slug.html"
echo "Pushed. Waiting for GitHub Pages to publish $url ..."
for _ in $(seq 1 40); do
  code="$(curl -s -o /dev/null -w '%{http_code}' "$url?cb=$RANDOM")"
  if [[ "$code" == "200" ]]; then echo "Live: $url"; exit 0; fi
  sleep 15
done
echo "Not live after 10 minutes (last status $code). Check the Pages build in the repo's Actions tab." >&2
exit 1
