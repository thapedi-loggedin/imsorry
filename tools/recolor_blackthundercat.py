from __future__ import annotations

import argparse
import colorsys
import json
from pathlib import Path

from PIL import Image


def clamp(value: float) -> int:
    return max(0, min(255, int(round(value))))


def cyan_signal(r: int, g: int, b: int, a: int) -> tuple[bool, float, float, float]:
    if a == 0:
        return False, 0, 0, 0
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    # Covers the original cyan/blue lightning, eyes, and antialiased edge pixels.
    is_cyan = 0.47 <= h <= 0.61 and s >= 0.28 and v >= 0.16 and b > r * 1.25 and g > r * 1.05
    return is_cyan, h, s, v


def recolor_pixel(r: int, g: int, b: int, a: int) -> tuple[int, int, int, int, bool]:
    is_cyan, _h, _s, v = cyan_signal(r, g, b, a)
    if is_cyan and v >= 0.46:
        # Keep edge antialiasing and internal shading while making bright accents read white.
        white = 188 + v * 67
        return clamp(white), clamp(white), clamp(white), a, True

    if is_cyan:
        # Dark blue/cyan antialiasing and fur reflections become neutral panther-gray,
        # not white patches.
        neutral = max(18, min(155, (r * 0.299 + g * 0.587 + b * 0.114) * 0.9))
        return clamp(neutral), clamp(neutral), clamp(neutral), a, True

    if a > 0:
        # Slightly deepen the neutral fur tones for a more panther-like read.
        h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        if s < 0.22 and v < 0.42:
            return clamp(r * 0.86), clamp(g * 0.86), clamp(b * 0.86), a, False

    return r, g, b, a, False


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output-png", required=True)
    parser.add_argument("--output-webp", required=True)
    parser.add_argument("--report", required=True)
    args = parser.parse_args()

    source = Path(args.input)
    image = Image.open(source).convert("RGBA")
    pixels = []
    changed = 0
    accent_pixels = 0

    for pixel in image.getdata():
        r, g, b, a = pixel
        nr, ng, nb, na, was_accent = recolor_pixel(r, g, b, a)
        if (nr, ng, nb, na) != pixel:
            changed += 1
        if was_accent:
            accent_pixels += 1
        pixels.append((nr, ng, nb, na))

    output = Image.new("RGBA", image.size)
    output.putdata(pixels)

    png_path = Path(args.output_png)
    webp_path = Path(args.output_webp)
    report_path = Path(args.report)
    png_path.parent.mkdir(parents=True, exist_ok=True)
    output.save(png_path, format="PNG")
    output.save(webp_path, format="WEBP", lossless=True, quality=100, method=6, exact=True)
    report_path.write_text(
        json.dumps(
            {
                "ok": True,
                "input": str(source),
                "output_png": str(png_path),
                "output_webp": str(webp_path),
                "changed_pixels": changed,
                "accent_pixels_recolored": accent_pixels,
                "size": image.size,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(report_path)


if __name__ == "__main__":
    main()
