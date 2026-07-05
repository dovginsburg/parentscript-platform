#!/usr/bin/env python3
"""
build_icons.py — render every required PNG size for a given product
from the four master SVGs in icons/branding/.

Usage:
    python3 build_icons.py <product>

<product> is "parentscript" or "tono".
"""
from __future__ import annotations
import os
import shutil
import subprocess
import sys
from pathlib import Path
from PIL import Image

PRODUCTS = {
    "parentscript": {
        "svg_dir": Path("/Users/Ezra/Projects/parentscript/apps/web/public/icons"),
        "out_dir": Path("/Users/Ezra/Projects/parentscript/apps/web/public/icons"),
        # source svg name, prefix used for the output PNGs (e.g. "icon-" or "tono-icon-")
        "square": "logo-square.svg",
        "mark":   "logo-mark.svg",
        "horiz":  "logo-horizontal.svg",
        "mono":   "logo-monogram.svg",
    },
    "tono": {
        "svg_dir": Path("/Users/Ezra/Projects/apps/tono/website/icons/branding"),
        "out_dir": Path("/Users/Ezra/Projects/apps/tono/website/icons"),
        "square": "tono-square.svg",
        "mark":   "tono-mark.svg",
        "horiz":  "tono-horizontal.svg",
        "mono":   "tono-monogram.svg",
    },
}

# Sizes required for the web/manifest layer.
# square -> fills the square/destination PNG; horiz -> horizontal lockup
WEB_SIZES_SQUARE = [16, 32, 120, 152, 167, 180, 192, 512, 1024]

# Apple iOS AppIcon sizes (rendered from square master)
IOS_SIZES = [20, 29, 40, 60, 76, 120, 152, 167, 1024]


def render_svg_to_png(svg: Path, out: Path, size_px: int, tag: str | None = None) -> None:
    """Use macOS qlmanage to render an SVG to a PNG, then Pillow resize.

    qlmanage is great at vector rendering on macOS — no system cairo
    dependency. Output is overwritten atomically. Each call uses its own
    scratch dir keyed on a deterministic tag to avoid races / clobbering.
    """
    tmpdir = Path("/tmp/_ql_build_icons")
    tmpdir.mkdir(parents=True, exist_ok=True)
    scratch = tmpdir / f"{svg.stem}-{tag or size_px}"
    if scratch.exists():
        shutil.rmtree(scratch)
    scratch.mkdir(parents=True)
    # qlmanage respects the size flag as the max dimension.
    cmd = ["qlmanage", "-t", "-s", str(size_px), "-o", str(scratch), str(svg)]
    subprocess.run(cmd, check=True, capture_output=True)
    src = scratch / (svg.stem + ".png")
    if not src.exists():
        raise RuntimeError(f"qlmanage did not produce {src}")
    img = Image.open(src).convert("RGBA")
    # Resize with high-quality downsampler. For square, force exact dims.
    img = img.resize((size_px, size_px), Image.LANCZOS)
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out, format="PNG", optimize=True)
    shutil.rmtree(scratch, ignore_errors=True)


def render_horizontal(svg: Path, out: Path, height_px: int, tag: str | None = None) -> None:
    """Render the horizontal lockup at a target height; width derives from viewBox."""
    tmpdir = Path("/tmp/_ql_build_icons")
    tmpdir.mkdir(parents=True, exist_ok=True)
    scratch = tmpdir / f"{svg.stem}-horiz-{tag or height_px}"
    if scratch.exists():
        shutil.rmtree(scratch)
    scratch.mkdir(parents=True)
    cmd = ["qlmanage", "-t", "-s", str(height_px * 4), "-o", str(scratch), str(svg)]
    subprocess.run(cmd, check=True, capture_output=True)
    src = scratch / (svg.stem + ".png")
    img = Image.open(src).convert("RGBA")
    # lockup viewBox is 768x192 (4:1); proportional resize to height h
    w = int(img.width * (height_px / img.height))
    img = img.resize((w, height_px), Image.LANCZOS)
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out, format="PNG", optimize=True)
    shutil.rmtree(scratch, ignore_errors=True)


def build_parentscript() -> None:
    cfg = PRODUCTS["parentscript"]
    svg_dir = cfg["svg_dir"]
    out_dir = cfg["out_dir"]
    square_svg = svg_dir / cfg["square"]

    # 1. Square icons used by manifest/web/PWA. File names match Apple's
    #    convention plus our existing convention.
    for size in WEB_SIZES_SQUARE:
        # main "icon-<size>.png"
        render_svg_to_png(square_svg, out_dir / f"icon-{size}.png", size)

    # Maskable variant = same square but with extra safe-area — we add
    # the same render with a small transparent border so when the OS clips
    # it for adaptive masks the glyph still clears.
    img_src = Image.open(out_dir / "icon-1024.png").convert("RGBA")
    border = int(1024 * 0.12)
    canvas = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    canvas.paste(img_src, (0, 0))
    mask = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    mask.paste(img_src, (0, 0))
    # shrink the inner content to leave a 12% safe-area
    inner = img_src.resize((1024 - 2 * border, 1024 - 2 * border), Image.LANCZOS)
    canvas.paste(inner, (border, border), inner)
    canvas.save(out_dir / "icon-512-maskable.png", format="PNG", optimize=True)

    # apple-touch-icon is the 180x180 PNG that iOS uses for home-screen
    # bookmarks; web manifests alias the standard icon-180.
    shutil.copyfile(out_dir / "icon-180.png", out_dir / "apple-touch-icon.png")
    render_svg_to_png(square_svg, out_dir / "apple-touch-icon-180.png", 180)
    # Some platforms hard-code the -120/-152/-167 variants from web app manifest
    for s in (120, 152, 167):
        render_svg_to_png(square_svg, out_dir / f"apple-touch-icon-{s}.png", s)

    # favicon.ico is multi-resolution; Pillow can pack a few sizes.
    favicon_sizes = [(16, 16), (32, 32), (48, 48)]
    favicon_imgs = []
    for sz in favicon_sizes:
        # Already have 16 and 32 from above; render 48 fresh.
        if sz[0] == 16:
            favicon_imgs.append(Image.open(out_dir / "icon-16.png").convert("RGBA"))
        elif sz[0] == 32:
            favicon_imgs.append(Image.open(out_dir / "icon-32.png").convert("RGBA"))
        else:
            tmp = Path("/tmp/_ql_build_icons") / "_favicon48"
            tmp.mkdir(parents=True, exist_ok=True)
            subprocess.run(
                ["qlmanage", "-t", "-s", "48", "-o", str(tmp), str(square_svg)],
                check=True, capture_output=True,
            )
            favicon_imgs.append(
                Image.open(tmp / (square_svg.stem + ".png")).convert("RGBA")
            )
    favicon_imgs[0].save(
        out_dir / "favicon.ico",
        format="ICO",
        sizes=[(s.width, s.height) for s in favicon_imgs],
        append_images=favicon_imgs[1:],
    )

    # og-image.png — 1200x630 social-share render of the brand.
    # Render the horizontal lockup large, paste on a clinical-warmth bg.
    horiz_svg = svg_dir / cfg["horiz"]
    tmp_horiz = out_dir / "_og_lockup.png"
    render_horizontal(horiz_svg, tmp_horiz, 320)
    bg = Image.new("RGBA", (1200, 630), (250, 251, 252, 255))  # FAFBFC surface
    lockup = Image.open(tmp_horiz).convert("RGBA")
    # center horizontally, vertical center biased upward
    paste_x = (1200 - lockup.width) // 2
    paste_y = (630 - lockup.height) // 2 - 30
    bg.paste(lockup, (paste_x, paste_y), lockup)
    # subtle bottom corner mark for social-context safety
    bg.save(out_dir / "og-image.png", format="PNG", optimize=True)
    tmp_horiz.unlink(missing_ok=True)
    # og-image-source keeps the bare mark on a clean background for future crops
    render_svg_to_png(svg_dir / cfg["mark"], out_dir / "og-image-source.png", 1024)


def build_tono() -> None:
    cfg = PRODUCTS["tono"]
    svg_dir = cfg["svg_dir"]
    out_dir = cfg["out_dir"]
    square_svg = svg_dir / cfg["square"]

    # Web icons — same naming as the existing set, just regenerated from
    # the master SVG so they're guaranteed to match.
    for size in WEB_SIZES_SQUARE:
        render_svg_to_png(square_svg, out_dir / f"tono-icon-{size}.png", size)

    # Maskable variant same as parentscript pattern.
    img_src = Image.open(out_dir / "tono-icon-1024.png").convert("RGBA")
    border = int(1024 * 0.12)
    inner = img_src.resize((1024 - 2 * border, 1024 - 2 * border), Image.LANCZOS)
    canvas = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    canvas.paste(inner, (border, border), inner)
    canvas.save(out_dir / "tono-icon-512-maskable.png", format="PNG", optimize=True)

    # apple-touch-icon and favicon
    shutil.copyfile(out_dir / "tono-icon-180.png", out_dir / "apple-touch-icon.png")
    render_svg_to_png(square_svg, out_dir / "apple-touch-icon-180.png", 180)
    for s in (120, 152, 167):
        render_svg_to_png(square_svg, out_dir / f"apple-touch-icon-{s}.png", s)

    favicon_sizes = [(16, 16), (32, 32), (48, 48)]
    favicon_imgs = []
    for sz in favicon_sizes:
        if sz[0] == 16:
            favicon_imgs.append(Image.open(out_dir / "tono-icon-16.png").convert("RGBA"))
        elif sz[0] == 32:
            favicon_imgs.append(Image.open(out_dir / "tono-icon-32.png").convert("RGBA"))
        else:
            tmp = Path("/tmp/_ql_build_icons") / "_tono_favicon48"
            tmp.mkdir(parents=True, exist_ok=True)
            subprocess.run(
                ["qlmanage", "-t", "-s", "48", "-o", str(tmp), str(square_svg)],
                check=True, capture_output=True,
            )
            favicon_imgs.append(
                Image.open(tmp / (square_svg.stem + ".png")).convert("RGBA")
            )
    favicon_imgs[0].save(
        out_dir / "favicon.ico",
        format="ICO",
        sizes=[(s.width, s.height) for s in favicon_imgs],
        append_images=favicon_imgs[1:],
    )

    # og-image for social — horizontal lockup on violet bg
    horiz_svg = svg_dir / cfg["horiz"]
    tmp_horiz = out_dir / "_og_lockup.png"
    render_horizontal(horiz_svg, tmp_horiz, 320)
    bg = Image.new("RGBA", (1200, 630), (14, 12, 20, 255))  # #0E0C14 dark
    lockup = Image.open(tmp_horiz).convert("RGBA")
    paste_x = (1200 - lockup.width) // 2
    paste_y = (630 - lockup.height) // 2 - 30
    bg.paste(lockup, (paste_x, paste_y), lockup)
    bg.save(out_dir / "og-image.png", format="PNG", optimize=True)
    tmp_horiz.unlink(missing_ok=True)
    render_svg_to_png(svg_dir / cfg["mark"], out_dir / "og-image-source.png", 1024)

    # 2. iOS AppIcon assets — overwrite the placeholder PNGs.
    ios_dir = Path("/Users/Ezra/Projects/apps/tono/ios/App/Assets.xcassets/AppIcon.appiconset")
    # Plain sizes
    for size in [20, 29, 40, 60, 76, 120, 152, 167, 1024]:
        render_svg_to_png(square_svg, ios_dir / f"icon-{size}.png", size)
    # 2x/3x variants: not all sizes are listed in Contents.json for every device —
    # we render all so any combination works, even if not used.
    for base in [20, 29, 40, 60]:
        render_svg_to_png(square_svg, ios_dir / f"icon-{base}@2x.png", base * 2)
        render_svg_to_png(square_svg, ios_dir / f"icon-{base}@3x.png", base * 3)
    render_svg_to_png(square_svg, ios_dir / "icon-120@2x.png", 240)


def main():
    product = sys.argv[1] if len(sys.argv) > 1 else "all"
    if product in ("parentscript", "all"):
        print("[parentscript] building icons...")
        build_parentscript()
        print("[parentscript] done.")
    if product in ("tono", "all"):
        print("[tono] building icons...")
        build_tono()
        print("[tono] done.")


if __name__ == "__main__":
    main()
