"""Split the combined home+vendor plate into two screenshots.

The plate renders both pages in one document so they share one stylesheet and
one canvas; the split points come from the two `.page-head` offsets measured
in the browser (see the render call).
"""

from pathlib import Path

from PIL import Image

SHOTS = Path(__file__).parent
SPLITS = {
    "1440": (40, 1078),
    "390": (76, 1359),
}

for suffix, (_, vendor_top) in SPLITS.items():
    src = SHOTS / f"plate-pages-{suffix}.png"
    img = Image.open(src)
    w, h = img.size
    img.crop((0, 0, w, vendor_top)).save(SHOTS / f"plate-home-{suffix}.png")
    img.crop((0, vendor_top, w, h)).save(SHOTS / f"plate-vendor-{suffix}.png")
    print(f"{suffix}: {w}x{h} -> home 0..{vendor_top}, vendor {vendor_top}..{h}")
