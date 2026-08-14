"""Generate dependency-free PNG icons for the PWA manifest."""

from pathlib import Path
import struct
import zlib


ROOT = Path(__file__).resolve().parents[1]


def inside_rounded_rect(x, y, left, top, right, bottom, radius):
    if left + radius <= x <= right - radius or top + radius <= y <= bottom - radius:
        return left <= x <= right and top <= y <= bottom
    cx = left + radius if x < left + radius else right - radius
    cy = top + radius if y < top + radius else bottom - radius
    return (x - cx) ** 2 + (y - cy) ** 2 <= radius**2


def render(size):
    scale = size / 512
    rows = []
    bars = [(139, 177, 173, 335), (203, 132, 237, 380), (267, 157, 301, 355), (331, 202, 365, 310)]
    for y in range(size):
        row = bytearray([0])
        py = y / scale
        for x in range(size):
            px = x / scale
            color = (17, 16, 15, 255)
            if inside_rounded_rect(px, py, 72, 72, 440, 440, 82):
                t = max(0, min(1, (px + py - 144) / 736))
                color = (round(255 - 25 * t), round(116 - 52 * t), round(79 - 47 * t), 255)
            for left, top, right, bottom in bars:
                radius = (right - left) / 2
                if inside_rounded_rect(px, py, left, top, right, bottom, radius):
                    color = (17, 16, 15, 255)
                    break
            row.extend(color)
        rows.append(bytes(row))
    return b"".join(rows)


def chunk(kind, data):
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)


def write_png(size):
    raw = render(size)
    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(raw, 9))
    png += chunk(b"IEND", b"")
    destination = ROOT / "assets" / "icons" / f"icon-{size}.png"
    destination.write_bytes(png)
    print(destination)


if __name__ == "__main__":
    write_png(192)
    write_png(512)
