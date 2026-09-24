#!/usr/bin/env python3
"""
OmniExtract CLI — Universal Web Media & Video Harvester
Fast command-line tool to extract and download all photos, videos, and audio from any website.
"""

import sys
import os
import re
import argparse
import urllib.parse
import urllib.request
import json
import zipfile
from html.parser import HTMLParser

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
}

EXT_IMAGE = {'jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'bmp', 'tiff'}
EXT_VIDEO = {'mp4', 'webm', 'mov', 'm4v', 'mkv', 'avi', 'flv', 'm3u8', 'ts'}
EXT_AUDIO = {'mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'}
EXT_SVG = {'svg'}

class SimpleMediaParser(HTMLParser):
    def __init__(self, base_url):
        super().__init__()
        self.base_url = base_url
        self.media = []
        self.seen = set()

    def add(self, raw_url, media_type, tag_source):
        if not raw_url or not isinstance(raw_url, str):
            return
        trimmed = raw_url.strip()
        if trimmed.startswith('javascript:') or trimmed.startswith('mailto:') or trimmed.startswith('data:image/gif'):
            return

        try:
            full_url = urllib.parse.urljoin(self.base_url, trimmed)
        except Exception:
            return

        if full_url in self.seen:
            return
        self.seen.add(full_url)

        # Infer extension and format
        path = urllib.parse.urlparse(full_url).path
        ext = os.path.splitext(path)[1].lower().replace('.', '')
        if not ext:
            ext = 'jpg' if media_type == 'image' else ('mp4' if media_type == 'video' else 'bin')

        self.media.append({
            'url': full_url,
            'type': media_type,
            'ext': ext,
            'source': tag_source
        })

    def handle_starttag(self, tag, attrs):
        attr_dict = {k.lower(): v for k, v in attrs if v is not None}

        # 1. <img>
        if tag == 'img':
            if 'src' in attr_dict:
                self.add(attr_dict['src'], 'image', 'img:src')
            if 'data-src' in attr_dict:
                self.add(attr_dict['data-src'], 'image', 'img:data-src')
            if 'srcset' in attr_dict:
                parts = [p.strip().split(' ')[0] for p in attr_dict['srcset'].split(',') if p.strip()]
                if parts:
                    self.add(parts[-1], 'image', 'img:srcset')

        # 2. <source> inside <picture> or <video>
        elif tag == 'source':
            if 'srcset' in attr_dict:
                parts = [p.strip().split(' ')[0] for p in attr_dict['srcset'].split(',') if p.strip()]
                if parts:
                    self.add(parts[-1], 'image', 'source:srcset')
            if 'src' in attr_dict:
                self.add(attr_dict['src'], 'video', 'source:src')

        # 3. <video>
        elif tag == 'video':
            if 'src' in attr_dict:
                self.add(attr_dict['src'], 'video', 'video:src')
            if 'poster' in attr_dict:
                self.add(attr_dict['poster'], 'image', 'video:poster')

        # 4. <meta>
        elif tag == 'meta':
            prop = attr_dict.get('property', '') or attr_dict.get('name', '')
            content = attr_dict.get('content', '')
            if 'image' in prop:
                self.add(content, 'image', f'meta:{prop}')
            elif 'video' in prop:
                self.add(content, 'video', f'meta:{prop}')

        # 5. <a> direct links
        elif tag == 'a' and 'href' in attr_dict:
            href = attr_dict['href']
            path = urllib.parse.urlparse(href).path.lower()
            ext = os.path.splitext(path)[1].replace('.', '')
            if ext in EXT_IMAGE:
                self.add(href, 'image', 'a:href')
            elif ext in EXT_VIDEO:
                self.add(href, 'video', 'a:href')
            elif ext in EXT_AUDIO:
                self.add(href, 'audio', 'a:href')
            elif ext in EXT_SVG:
                self.add(href, 'svg', 'a:href')

def fetch_html(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=12) as response:
        return response.read().decode('utf-8', errors='ignore')

def download_file(url, out_path):
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=15) as response:
            with open(out_path, 'wb') as f:
                f.write(response.read())
        return True
    except Exception as e:
        print(f"  [!] Failed to download {url}: {e}", file=sys.stderr)
        return False

def main():
    parser = argparse.ArgumentParser(description="OmniExtract — Universal Web Media & Video Harvester")
    parser.add_argument("url", help="Target website URL to extract media from")
    parser.add_argument("-o", "--output", default="downloads", help="Output directory (default: downloads/)")
    parser.add_argument("-d", "--download", action="store_true", help="Download all discovered media files")
    parser.add_argument("-t", "--type", choices=['all', 'image', 'video', 'audio', 'svg'], default='all', help="Filter by media type")
    parser.add_argument("-z", "--zip", help="Package downloaded media into a .zip file (e.g. output.zip)")
    parser.add_argument("--json", action="store_true", help="Output results as JSON")

    args = parser.parse_args()

    url = args.url.strip()
    if not url.startswith('http://') and not url.startswith('https://'):
        url = 'https://' + url

    if not args.json:
        print(f"\n==================================================")
        print(f"  OMNIEXTRACT CLI // Universal Media Harvester")
        print(f"  Target: {url}")
        print(f"==================================================")
        print(f"[*] Fetching webpage...")

    try:
        html = fetch_html(url)
    except Exception as e:
        print(f"[-] Error fetching {url}: {e}", file=sys.stderr)
        sys.exit(1)

    parser_obj = SimpleMediaParser(url)
    parser_obj.feed(html)

    media_items = parser_obj.media
    if args.type != 'all':
        media_items = [m for m in media_items if m['type'] == args.type]

    if args.json:
        print(json.dumps({'url': url, 'count': len(media_items), 'items': media_items}, indent=2))
        return

    # Count breakdown
    counts = {'image': 0, 'video': 0, 'audio': 0, 'svg': 0}
    for m in media_items:
        counts[m['type']] = counts.get(m['type'], 0) + 1

    print(f"[+] Total Discovered: {len(media_items)} items")
    print(f"    - Photos & Images : {counts['image']}")
    print(f"    - Videos & Streams: {counts['video']}")
    print(f"    - Audio Tracks    : {counts['audio']}")
    print(f"    - Vector SVGs     : {counts['svg']}")

    if args.download or args.zip:
        out_dir = args.output
        os.makedirs(out_dir, exist_ok=True)
        print(f"\n[*] Downloading {len(media_items)} items to '{out_dir}/'...")

        downloaded_paths = []
        for i, item in enumerate(media_items, 1):
            filename = f"media_{i:03d}.{item['ext']}"
            out_file = os.path.join(out_dir, filename)
            print(f"  [{i}/{len(media_items)}] {item['type'].upper()} -> {filename} ...", end=" ")
            if download_file(item['url'], out_file):
                downloaded_paths.append(out_file)
                print("DONE")

        if args.zip and downloaded_paths:
            zip_name = args.zip if args.zip.endswith('.zip') else f"{args.zip}.zip"
            print(f"\n[*] Packaging archive into '{zip_name}'...")
            with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as zf:
                for fpath in downloaded_paths:
                    zf.write(fpath, os.path.basename(fpath))
            print(f"[+] Archive ready: {zip_name}")

    print("\n[+] Scan finished successfully.\n")

if __name__ == '__main__':
    main()
