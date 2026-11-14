#!/usr/bin/env python3
"""Zot Vitro: put the Zot Vitro mark (a V) where Zotero's Z is, in the toolbar
icons, and draw the extension icons. Zotero's name and logo are its trademarks.
Run once from the repository root; the results are committed."""
import glob, re, subprocess, pathlib

ACCENT = "#7C5CFA"
# The V in the 16 px toolbar icon, and in the badge corner (x 9.7–16, y 9–16).
V_FULL = "M1.5 1.5H5.2L8 10.2L10.8 1.5H14.5L10.2 14.5H5.8Z"
V_BADGE = "M9.7 9H11.75L12.85 12.55L13.95 9H16L13.9 16H11.8Z"

# Zotero's Z: in the badge corner, and filling the toolbar icon.
Z_BADGE = "M16 9.865L15.582 9H10.137"
Z_FULL = "M13.863 2.73L13.027 1H2.137"

def rewrite(path, z, v):
    svg = pathlib.Path(path).read_text()
    def swap(m):
        tag = re.sub(r'd="[^"]*"', f'd="{v}"', m.group(0))
        return tag.replace('fill="#DB2C3A"', f'fill="{ACCENT}"')
    new, n = re.subn(r'<path[^>]*d="' + re.escape(z) + r'[^"]*"[^>]*>', swap, svg)
    if n:
        pathlib.Path(path).write_text(new)
    return n

count = sum(rewrite(p, Z_BADGE, V_BADGE) for p in glob.glob("icons/badged/*.svg"))
count += sum(rewrite(p, Z_FULL, V_FULL) for p in glob.glob("icons/z*.svg"))
print("marks replaced:", count)

ICON = f'''<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
<rect x="4" y="4" width="120" height="120" rx="28" fill="{ACCENT}"/>
<path d="M26 30H46L64 84L82 30H102L76 100H52Z" fill="white"/>
</svg>'''
pathlib.Path("icons/vitro.svg").write_text(ICON)
for size in (16, 32, 64, 128):
    subprocess.run(["rsvg-convert", "-w", str(size), "-h", str(size), "icons/vitro.svg",
                    "-o", f"icons/Icon-{size}.png"], check=True)
