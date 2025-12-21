#!/usr/bin/env python3
"""
Blog post publisher: Markdown -> HTML using the site template.

Usage:
    uv run publish.py path/to/post.md
    uv run publish.py path/to/post.md --dry-run

Frontmatter format:
    ---
    title: "Post Title"
    date: 2025-12-21
    tags: [AI Workflows, Projects]
    excerpt: "A brief description for the index page."
    slug: optional-custom-slug  # defaults to filename
    hero: hero.png  # optional, relative to post's image folder
    ---
"""
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "markdown>=3.5",
#     "pyyaml>=6.0",
# ]
# ///

import argparse
import re
import shutil
import sys
from datetime import datetime
from pathlib import Path

import markdown
import yaml


def parse_frontmatter(content: str) -> tuple[dict, str]:
    """Extract YAML frontmatter and body from markdown content."""
    pattern = r"^---\s*\n(.*?)\n---\s*\n(.*)$"
    match = re.match(pattern, content, re.DOTALL)
    if not match:
        raise ValueError("No frontmatter found. Post must start with ---")

    frontmatter = yaml.safe_load(match.group(1))
    body = match.group(2)
    return frontmatter, body


def markdown_to_html(md_content: str) -> str:
    """Convert markdown to HTML with common extensions."""
    md = markdown.Markdown(extensions=[
        'fenced_code',
        'tables',
        'toc',
        'smarty',
    ])
    return md.convert(md_content)


def format_date(date_val) -> str:
    """Format date for display."""
    if isinstance(date_val, datetime):
        return date_val.strftime("%B %d, %Y")
    elif isinstance(date_val, str):
        dt = datetime.fromisoformat(date_val)
        return dt.strftime("%B %d, %Y")
    else:
        # Assume it's a date object
        return date_val.strftime("%B %d, %Y")


def generate_post_html(template: str, frontmatter: dict, body_html: str, slug: str) -> str:
    """Insert content into the post template."""
    html = template

    # Replace title
    html = html.replace("POST TITLE HERE", frontmatter["title"])
    html = html.replace("<title>POST TITLE", f"<title>{frontmatter['title']}")

    # Replace date
    formatted_date = format_date(frontmatter["date"])
    html = re.sub(
        r'<span>December \d+, \d+</span>',
        f'<span>{formatted_date}</span>',
        html
    )

    # Replace tags
    tags = frontmatter.get("tags", [])
    if isinstance(tags, str):
        tags = [tags]
    tags_html = "".join(f'<span class="post-tag">{tag}</span>' for tag in tags)
    html = re.sub(
        r'<span class="post-tag">AI Workflows</span>',
        tags_html,
        html
    )

    # Add hero image if specified
    hero = frontmatter.get("hero")
    hero_html = ""
    if hero:
        hero_html = f'<img src="{slug}/{hero}" alt="{frontmatter["title"]}" class="hero-image" style="width:100%; border-radius:12px; margin-bottom:2rem; border:1px solid var(--border-color);">\n      '

    # Replace article content (with hero image prepended)
    html = re.sub(
        r'<article>.*?</article>',
        f'<article>\n      {hero_html}{body_html}\n    </article>',
        html,
        flags=re.DOTALL
    )

    # Fix image paths (./slug/image.png -> slug/image.png for relative paths)
    html = html.replace(f'./{slug}/', f'{slug}/')

    return html


def generate_post_card(frontmatter: dict, slug: str) -> str:
    """Generate the HTML for a post card on the index page."""
    formatted_date = format_date(frontmatter["date"])
    tags = frontmatter.get("tags", [])
    if isinstance(tags, str):
        tags = [tags]
    tags_html = "".join(f'<span class="post-tag">{tag}</span>' for tag in tags)

    return f'''<a href="blog/{slug}.html" class="post-card">
        <h2>{frontmatter["title"]}</h2>
        <div class="post-meta">
          <span>{formatted_date}</span>
          {tags_html}
        </div>
        <p class="post-excerpt">{frontmatter.get("excerpt", "")}</p>
      </a>'''


def update_blog_index(blog_html_path: Path, post_card: str, frontmatter: dict, slug: str) -> str:
    """Update blog.html with the new post card, maintaining date order."""
    content = blog_html_path.read_text()

    # Remove empty state if present
    content = re.sub(
        r'<div class="empty-state">.*?</div>\s*',
        '',
        content,
        flags=re.DOTALL
    )

    # Check if this post already exists (for updates)
    existing_pattern = rf'<a href="blog/{slug}\.html" class="post-card">.*?</a>'
    if re.search(existing_pattern, content, flags=re.DOTALL):
        # Replace existing card
        content = re.sub(existing_pattern, post_card, content, flags=re.DOTALL)
        print(f"  Updated existing post card in index")
    else:
        # Add new card at the top (assumes newest posts first)
        posts_pattern = r'(<section class="posts">)\s*'
        replacement = f'\\1\n      {post_card}\n      '
        content = re.sub(posts_pattern, replacement, content)
        print(f"  Added new post card to index")

    return content


def copy_images(source_dir: Path, slug: str, dest_blog_dir: Path, dry_run: bool = False) -> list[Path]:
    """Copy image folder if it exists."""
    image_folder = source_dir / slug
    copied = []

    if image_folder.is_dir():
        dest_folder = dest_blog_dir / slug
        if dry_run:
            print(f"  Would copy {image_folder} -> {dest_folder}")
            for img in image_folder.glob("*"):
                copied.append(img)
        else:
            if dest_folder.exists():
                shutil.rmtree(dest_folder)
            shutil.copytree(image_folder, dest_folder)
            copied = list(dest_folder.glob("*"))
            print(f"  Copied {len(copied)} images to {dest_folder}")

    return copied


def main():
    parser = argparse.ArgumentParser(description="Publish markdown blog post to HTML")
    parser.add_argument("post", type=Path, help="Path to markdown file")
    parser.add_argument("--dry-run", action="store_true", help="Show what would happen without making changes")
    parser.add_argument("--site-dir", type=Path, default=Path(__file__).parent, help="Path to site root")
    args = parser.parse_args()

    # Resolve paths
    post_path = args.post.resolve()
    site_dir = args.site_dir.resolve()
    template_path = site_dir / "blog" / "_template.html"
    blog_html_path = site_dir / "blog.html"
    blog_dir = site_dir / "blog"

    # Validate
    if not post_path.exists():
        print(f"Error: {post_path} not found")
        sys.exit(1)
    if not template_path.exists():
        print(f"Error: {template_path} not found")
        sys.exit(1)

    # Parse the post
    print(f"Publishing: {post_path.name}")
    content = post_path.read_text()
    frontmatter, body = parse_frontmatter(content)

    # Determine slug
    slug = frontmatter.get("slug", post_path.stem)
    print(f"  Slug: {slug}")
    print(f"  Title: {frontmatter['title']}")
    print(f"  Date: {format_date(frontmatter['date'])}")
    print(f"  Tags: {frontmatter.get('tags', [])}")

    # Convert markdown to HTML
    body_html = markdown_to_html(body)

    # Generate post HTML
    template = template_path.read_text()
    post_html = generate_post_html(template, frontmatter, body_html, slug)

    # Generate post card for index
    post_card = generate_post_card(frontmatter, slug)

    # Update blog index
    blog_index_html = update_blog_index(blog_html_path, post_card, frontmatter, slug)

    # Copy images
    images = copy_images(post_path.parent, slug, blog_dir, args.dry_run)

    if args.dry_run:
        print("\n[DRY RUN] Would create/update:")
        print(f"  - {blog_dir / slug}.html")
        print(f"  - {blog_html_path}")
        if images:
            print(f"  - {len(images)} images in {blog_dir / slug}/")
        print("\nPost preview (first 500 chars of body):")
        print(body_html[:500] + "...")
    else:
        # Write post HTML
        post_output = blog_dir / f"{slug}.html"
        post_output.write_text(post_html)
        print(f"  Created: {post_output}")

        # Update blog index
        blog_html_path.write_text(blog_index_html)
        print(f"  Updated: {blog_html_path}")

        print(f"\nDone! View at: file://{post_output}")
        print(f"Or after push: https://konradodell.com/blog/{slug}.html")


if __name__ == "__main__":
    main()
