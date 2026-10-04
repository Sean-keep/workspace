#!/usr/bin/env python3
"""生成 PWA 用的 PNG 图标（192 / 512，普通 + maskable）。

这台机器上 PIL / sharp / ImageMagick / rsvg-convert 一个都没有，所以手写 PNG
编码 —— 只用标准库的 zlib + struct，不装任何东西，也不进 package.json。

图标构图跟 frontend/public/icon.svg、icon-maskable.svg 一致：圆角蓝底 + 2×2
白色圆角方块（任务/日程/笔记/书签）；maskable 版把图形压到中心 60%、底色铺满。
**改构图要同时改这三个文件。**

用法：
    python3 scripts/gen_icons.py
"""
from __future__ import annotations

import struct
import zlib
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent.parent / "frontend" / "public"

BLUE = (64, 158, 255)
WHITE = (255, 255, 255)
SS = 4  # 超采样倍数，只为圆角边缘别太锯

# (x0, y0, x1, y1, radius) —— 设计坐标系里的图形，与同名 SVG 对齐
PLAIN_BG = (0, 0, 192, 192, 42)
PLAIN_SQUARES = [
    (44, 44, 88, 88, 10, 1.0),
    (104, 44, 148, 88, 10, 0.82),
    (44, 104, 88, 148, 10, 0.82),
    (104, 104, 148, 148, 10, 1.0),
]
MASK_BG = (0, 0, 512, 512, 0)
MASK_SQUARES = [
    (146, 146, 242, 242, 20, 1.0),
    (270, 146, 366, 242, 20, 0.82),
    (146, 270, 242, 366, 20, 0.82),
    (270, 270, 366, 366, 20, 1.0),
]


def in_round_rect(x: float, y: float, x0: float, y0: float, x1: float, y1: float, r: float) -> bool:
    """点 (x, y) 是否落在圆角矩形内。"""
    if not (x0 <= x <= x1 and y0 <= y <= y1):
        return False
    if r <= 0:
        return True
    cx = min(max(x, x0 + r), x1 - r)
    cy = min(max(y, y0 + r), y1 - r)
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r


def render(size: int, *, maskable: bool) -> list[bytes]:
    """画一张 size×size 的 RGBA 图标，返回 PNG 用的扫描行（每行前置 filter 0）。"""
    design = 512 if maskable else 192
    k = size / design * SS
    bg = MASK_BG if maskable else PLAIN_BG
    squares = MASK_SQUARES if maskable else PLAIN_SQUARES

    bg_x0, bg_y0, bg_x1, bg_y1, bg_r = (v * k for v in bg)
    # 只缩放坐标和圆角 —— 最后那个 opacity 是比例，不能跟着缩
    rects = [tuple(v * k for v in r[:5]) + (r[5],) for r in squares]

    hi = size * SS
    buf = bytearray(hi * hi * 4)
    for y in range(hi):
        cy = y + 0.5
        for x in range(hi):
            if not in_round_rect(x + 0.5, cy, bg_x0, bg_y0, bg_x1, bg_y1, bg_r):
                continue  # 圆角外是透明
            r, g, b = BLUE
            for sx0, sy0, sx1, sy1, sr, op in rects:
                if in_round_rect(x + 0.5, cy, sx0, sy0, sx1, sy1, sr):
                    # 白色按 opacity 叠在蓝底上
                    r = int(WHITE[0] * op + r * (1 - op))
                    g = int(WHITE[1] * op + g * (1 - op))
                    b = int(WHITE[2] * op + b * (1 - op))
            i = (y * hi + x) * 4
            buf[i] = r
            buf[i + 1] = g
            buf[i + 2] = b
            buf[i + 3] = 255

    # 超采样降采样。走预乘 alpha 平均，否则圆角边缘会留下一圈暗边
    # （直接平均 (64,158,255,255) 和 (0,0,0,0) 得到的是暗色半透明像素）。
    out = bytearray(size * size * 4)
    n = SS * SS
    for y in range(size):
        for x in range(size):
            rs = gs = bs = asum = 0
            for dy in range(SS):
                base = ((y * SS + dy) * hi + x * SS) * 4
                for dx in range(SS):
                    i = base + dx * 4
                    a = buf[i + 3]
                    rs += buf[i] * a
                    gs += buf[i + 1] * a
                    bs += buf[i + 2] * a
                    asum += a
            o = (y * size + x) * 4
            if asum == 0:
                out[o + 3] = 0
                continue
            out[o] = rs // asum
            out[o + 1] = gs // asum
            out[o + 2] = bs // asum
            out[o + 3] = asum // n

    return [bytes(out[y * size * 4 : (y + 1) * size * 4]) for y in range(size)]


def png_bytes(size: int, rows: list[bytes]) -> bytes:
    """8-bit RGBA PNG。chunk 结构 = 长度 + 类型 + 数据 + CRC32。"""

    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    raw = b"".join(b"\x00" + row for row in rows)
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)  # 8-bit, RGBA
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    jobs = [
        (192, False, "icon-192.png"),
        (512, False, "icon-512.png"),
        (192, True, "icon-maskable-192.png"),
        (512, True, "icon-maskable-512.png"),
    ]
    for size, maskable, name in jobs:
        path = OUT_DIR / name
        path.write_bytes(png_bytes(size, render(size, maskable=maskable)))
        print(f"wrote {path.relative_to(OUT_DIR.parent.parent)} ({path.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
