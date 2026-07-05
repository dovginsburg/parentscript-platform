"""Render brand-book logo showcase PNGs for ParentScript and Tono.

Proves the logos hold up at every shipping size by compositing the four
SVG variants into one image per platform:
  - Panel A: square mark scaled (220 hero + 180/120/64/40/24 stack)
  - Panel B: horizontal lockup + monogram
  - Panel C: square mark + monogram on alternate surface (contrast proof)
  - Panel D: home-screen rasterization row (180/120/80/60/40/29)

Source SVGs:
  - ParentScript:  apps/web/public/icons/logo-{square,horizontal,monogram}.svg
  - Tono:          website/icons/branding/tono-{square,horizontal,monogram}.svg

Output:
  - parentscript/docs/brand-showcase/logo-showcase-parentscript.png
  - tono/website/docs/brand-showcase/logo-showcase-tono.png

Renders SVGs via macOS qlmanage (the only free renderer with a working
libcairo install on this Mac). qlmanage always produces a square PNG,
so for the horizontal lockup we crop to the actual content bbox.
"""
import os
import shutil
import subprocess
import time
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

PRODUCTS = [
    {
        "name": "parentscript",
        "out_dir": "/Users/Ezra/Projects/parentscript/docs/brand-showcase",
        "sources": {
            "square":  "/Users/Ezra/Projects/parentscript/apps/web/public/icons/logo-square.svg",
            "horizontal": "/Users/Ezra/Projects/parentscript/apps/web/public/icons/logo-horizontal.svg",
            "monogram": "/Users/Ezra/Projects/parentscript/apps/web/public/icons/logo-monogram.svg",
        },
        "label": "ParentScript",
        "tagline": "Say the right thing at the right time.",
        "label_color": "#111827",
        "tagline_color": "#6B7280",
        "panel_border": "#E5E7EB",
        "native_bg": "#FFFFFF",
        "alt_bg": "#0F172A",          # dark surface contrast proof
        "alt_text_color": "#FFFFFF",
    },
    {
        "name": "tono",
        "out_dir": "/Users/Ezra/Projects/apps/tono/website/docs/brand-showcase",
        "sources": {
            "square":  "/Users/Ezra/Projects/apps/tono/website/icons/branding/tono-square.svg",
            "horizontal": "/Users/Ezra/Projects/apps/tono/website/icons/branding/tono-horizontal.svg",
            "monogram": "/Users/Ezra/Projects/apps/tono/website/icons/branding/tono-monogram.svg",
        },
        "label": "tono",
        "tagline": "pick one. copy. send.",
        "label_color": "#FFFFFF",
        "tagline_color": "#9CA3AF",
        "panel_border": "#2A2A30",
        "native_bg": "#0A0A0A",
        "alt_bg": "#FFFFFF",          # light surface contrast proof
        "alt_text_color": "#111827",
    },
]


def render_svg_to_png(svg_path: str, out_png: str, size: int, retries: int = 8) -> bool:
    """Render an SVG to a square PNG via qlmanage. qlmanage is flaky on
    macOS — retry hard."""
    svg_path = os.path.abspath(svg_path)
    os.makedirs(os.path.dirname(out_png), exist_ok=True)
    tmp_dir = f"/tmp/_ql_{int(time.time()*1e6)}_{os.getpid()}"
    if os.path.exists(tmp_dir):
        shutil.rmtree(tmp_dir)
    os.makedirs(tmp_dir, exist_ok=True)

    last_err = None
    for _ in range(retries):
        try:
            r = subprocess.run(
                ["qlmanage", "-t", "-s", str(size), "-o", tmp_dir, svg_path],
                capture_output=True, text=True, timeout=20,
            )
            candidates = [f for f in os.listdir(tmp_dir) if f.endswith(".png")]
            if candidates:
                src = os.path.join(tmp_dir, candidates[0])
                img = Image.open(src).convert("RGBA")
                if img.size != (size, size):
                    img = img.resize((size, size), Image.LANCZOS)
                img.save(out_png, "PNG")
                shutil.rmtree(tmp_dir, ignore_errors=True)
                return True
            last_err = f"rc={r.returncode} stderr={r.stderr!r}"
        except Exception as e:
            last_err = repr(e)
        time.sleep(0.5)
    shutil.rmtree(tmp_dir, ignore_errors=True)
    print(f"  FAIL after {retries} attempts: {os.path.basename(svg_path)} -> {size}px ({last_err})")
    return False


def load_font(size: int):
    for path in [
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/SFNSDisplay.ttf",
        "/Library/Fonts/Arial.ttf",
    ]:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size=size)
            except Exception:
                pass
    return ImageFont.load_default()


def fit_within(img: Image.Image, max_w: int, max_h: int) -> Image.Image:
    w, h = img.size
    scale = min(max_w / w, max_h / h)
    if scale < 1.0:
        return img.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)
    return img


def build_showcase(product: dict) -> str:
    name = product["name"]
    print(f"\n=== {name} ===")
    out_dir = Path(product["out_dir"])
    out_dir.mkdir(parents=True, exist_ok=True)

    square_src = product["sources"]["square"]
    horizontal_src = product["sources"]["horizontal"]
    monogram_src = product["sources"]["monogram"]

    # Hero size + comparison stack
    sq_sizes = [180, 120, 64, 40, 24]
    sq_renders = {}
    for sz in [360] + sq_sizes:
        p = out_dir / f"_src_sq_{sz}.png"
        if not render_svg_to_png(square_src, str(p), sz):
            raise RuntimeError(f"could not render square {sz} for {name}")
        sq_renders[sz] = Image.open(str(p)).convert("RGBA")
    big_sq = sq_renders.pop(360)

    # Horizontal lockup — crop the content bbox out of the square qlmanage output
    h_path = out_dir / "_src_h_768.png"
    if not render_svg_to_png(horizontal_src, str(h_path), 768):
        raise RuntimeError(f"could not render horizontal for {name}")
    arr = np.array(Image.open(str(h_path)).convert("RGBA"))
    nonwhite = ~((arr[:,:,0] > 240) & (arr[:,:,1] > 240) & (arr[:,:,2] > 240))
    ys, xs = np.where(nonwhite)
    if len(ys) == 0:
        raise RuntimeError(f"horizontal lockup rendered empty for {name}")
    bbox = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
    h_img_native = Image.open(str(h_path)).convert("RGBA").crop(bbox)
    print(f"  horizontal lockup bbox: {bbox} -> {h_img_native.size}")

    # Monogram
    m_path = out_dir / "_src_m_128.png"
    if not render_svg_to_png(monogram_src, str(m_path), 128):
        raise RuntimeError(f"could not render monogram for {name}")
    m_img = Image.open(str(m_path)).convert("RGBA")

    # ── Composite ──
    W, H = 1600, 1000
    canvas = Image.new("RGB", (W, H), product["native_bg"])
    draw = ImageDraw.Draw(canvas)

    title_font = load_font(48)
    sub_font = load_font(20)
    chip_font = load_font(13)
    panel_title_font = load_font(16)

    draw.text((64, 48), product["label"], fill=product["label_color"], font=title_font)
    draw.text((64, 110), product["tagline"], fill=product["tagline_color"], font=sub_font)

    grid_x0, grid_y0 = 64, 180
    grid_x1, grid_y1 = W - 64, H - 64
    cell_w = (grid_x1 - grid_x0 - 32) // 2
    cell_h = (grid_y1 - grid_y0 - 32) // 2

    panels = {
        "A": (grid_x0, grid_y0, grid_x0 + cell_w, grid_y0 + cell_h),
        "B": (grid_x0 + cell_w + 32, grid_y0, grid_x1, grid_y0 + cell_h),
        "C": (grid_x0, grid_y0 + cell_h + 32, grid_x0 + cell_w, grid_y1),
        "D": (grid_x0 + cell_w + 32, grid_y0 + cell_h + 32, grid_x1, grid_y1),
    }

    def draw_panel_border(box, title):
        draw.rectangle([box[0], box[1], box[2], box[3]], outline=product["panel_border"], width=2)
        draw.text((box[0] + 16, box[1] + 12), title, fill=product["label_color"], font=panel_title_font)

    # ── Panel A: square mark scale ──
    box = panels["A"]
    draw_panel_border(box, "Square mark — scaled")
    inner = (box[0] + 20, box[1] + 48, box[2] - 20, box[3] - 20)
    big_size = 220
    big = big_sq.resize((big_size, big_size), Image.LANCZOS)
    big_box = (inner[0], inner[1], inner[0] + big_size, inner[1] + big_size)
    canvas.paste(big, (big_box[0], big_box[1]), big)
    draw.text((big_box[0], big_box[3] + 8), f"{big_size}px (hero)", fill=product["tagline_color"], font=chip_font)
    stack_x = big_box[2] + 28
    for sz in sq_sizes:
        img = sq_renders[sz]
        y = inner[1] + (big_size - sz) // 2
        canvas.paste(img, (stack_x, y), img)
        draw.text((stack_x, inner[1] + big_size + 8), f"{sz}px", fill=product["tagline_color"], font=chip_font)
        stack_x += sz + 22

    # ── Panel B: lockups ──
    box = panels["B"]
    draw_panel_border(box, "Lockups")
    inner = (box[0] + 20, box[1] + 48, box[2] - 20, box[3] - 20)
    h_target_w = (inner[2] - inner[0]) - 40
    h_target_h = 110
    h_fitted = fit_within(h_img_native, h_target_w, h_target_h)
    h_y = inner[1] + 10
    canvas.paste(h_fitted, (inner[0] + (inner[2] - inner[0] - h_fitted.size[0]) // 2, h_y), h_fitted)
    draw.text((inner[0] + 10, h_y + h_fitted.size[1] + 10),
              f"horizontal  {h_img_native.size[0]}×{h_img_native.size[1]}",
              fill=product["tagline_color"], font=chip_font)
    m_target = 96
    m_y = inner[3] - m_target - 36
    mx = inner[0] + 30
    canvas.paste(m_img.resize((m_target, m_target), Image.LANCZOS), (mx, m_y))
    draw.text((mx + m_target + 16, m_y + m_target // 2 - 8), "monogram", fill=product["label_color"], font=panel_title_font)
    draw.text((mx + m_target + 16, m_y + m_target // 2 + 10),
              f"{m_img.size[0]}×{m_img.size[0]}", fill=product["tagline_color"], font=chip_font)

    # ── Panel C: on alternate surface ──
    box = panels["C"]
    draw.rectangle([box[0], box[1], box[2], box[3]], fill=product["alt_bg"])
    title_color = product["alt_text_color"]
    draw.text((box[0] + 16, box[1] + 12), "On alternate surface", fill=title_color, font=panel_title_font)
    inner = (box[0] + 20, box[1] + 48, box[2] - 20, box[3] - 20)
    big_alt = sq_renders[180]
    ax = inner[0] + (inner[2] - inner[0]) // 2 - 220
    ay = inner[1] + (inner[3] - inner[1] - 180) // 2
    canvas.paste(big_alt, (ax, ay), big_alt)
    draw.text((ax, ay + 200), "180px square", fill=title_color, font=chip_font)
    ax2 = ax + 180 + 60
    canvas.paste(m_img.resize((180, 180), Image.LANCZOS), (ax2, ay), m_img.resize((180, 180), Image.LANCZOS))
    draw.text((ax2, ay + 200), "180px monogram", fill=title_color, font=chip_font)
    bg_label = "white" if product["alt_bg"] == "#FFFFFF" else "dark"
    native_label = "white" if product["native_bg"] == "#FFFFFF" else "dark"
    draw.text((box[0] + 16, box[3] - 32),
              f"native: {native_label} bg   •   shown on {bg_label} surface",
              fill=title_color, font=chip_font)

    # ── Panel D: home-screen sizes ──
    box = panels["D"]
    draw_panel_border(box, "Home-screen rasterization (from SVG)")
    inner = (box[0] + 20, box[1] + 48, box[2] - 20, box[3] - 20)
    home_sizes = [180, 120, 80, 60, 40, 29]
    home_renders = {}
    for sz in home_sizes:
        p = out_dir / f"_src_home_{sz}.png"
        if not render_svg_to_png(square_src, str(p), sz):
            raise RuntimeError(f"could not render home {sz} for {name}")
        home_renders[sz] = Image.open(str(p)).convert("RGBA")
    row_h = 200
    row_y = inner[1] + (inner[3] - inner[1] - row_h) // 2
    total_w = sum(home_renders[sz].size[0] for sz in home_sizes) + 24 * (len(home_sizes) - 1)
    cur_x = inner[0] + max(20, (inner[2] - inner[0] - total_w) // 2)
    for sz in home_sizes:
        img = home_renders[sz]
        iw, ih = img.size
        y = row_y + (row_h - ih) // 2 - 10
        canvas.paste(img, (cur_x, y), img)
        draw.text((cur_x, row_y + row_h - 8), f"{sz}", fill=product["tagline_color"], font=chip_font)
        cur_x += iw + 24

    out_main = out_dir / f"logo-showcase-{name}.png"
    canvas.save(out_main, "PNG")
    print(f"  wrote {out_main}")
    # Clean up the intermediate _src_*.png files
    for p in out_dir.glob("_src_*.png"):
        p.unlink()
    for p in out_dir.glob("_home_*.png"):
        p.unlink()
    return str(out_main)


def main():
    for p in PRODUCTS:
        build_showcase(p)


if __name__ == "__main__":
    main()