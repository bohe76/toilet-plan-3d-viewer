"""기울기 보정된 300dpi 도면에서 긴 수직선·수평선을 검출하고 눈금자 타일을 만든다.

사용: python scripts/measure_plan.py <image> <outdir> <x0> <y0> <x1> <y1> <cols> <rows> [min_len]
좌표는 300dpi 이미지 픽셀이다. 출력: <outdir>/segments.json, <outdir>/tile_rRcC.png
"""
import json
import os
import sys

import cv2
import numpy as np

MARGIN = 46


def find_segments(mask, vertical, min_len, ox, oy):
    size = (1, min_len) if vertical else (min_len, 1)
    opened = cv2.morphologyEx(mask, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT, size))
    n, _, stats, _ = cv2.connectedComponentsWithStats(opened, connectivity=8)
    out = []
    for i in range(1, n):
        x, y, w, h, _ = (int(v) for v in stats[i])
        thick = w if vertical else h
        if thick > 14:
            continue
        if vertical:
            out.append({"pos": ox + x + w / 2, "a": oy + y, "b": oy + y + h, "t": w})
        else:
            out.append({"pos": oy + y + h / 2, "a": ox + x, "b": ox + x + w, "t": h})
    return sorted(out, key=lambda s: (s["pos"], s["a"]))


def ruler_tile(bgr, gray, x0, y0, x1, y1):
    crop = bgr[y0:y1, x0:x1].copy()
    paper = gray[y0:y1, x0:x1] > 200
    for gx in range((x0 // 100 + 1) * 100, x1, 100):
        col = gx - x0
        crop[paper[:, col], col] = (255, 200, 120)
    for gy in range((y0 // 100 + 1) * 100, y1, 100):
        row = gy - y0
        crop[row, paper[row, :]] = (255, 200, 120)
    h, w = crop.shape[:2]
    tile = np.full((h + MARGIN, w + MARGIN, 3), 255, np.uint8)
    tile[MARGIN:, MARGIN:] = crop
    for gx in range((x0 // 100 + 1) * 100, x1, 100):
        cv2.putText(tile, str(gx), (gx - x0 + MARGIN - 18, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 60, 0), 1, cv2.LINE_AA)
    for gy in range((y0 // 100 + 1) * 100, y1, 100):
        cv2.putText(tile, str(gy), (2, gy - y0 + MARGIN + 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 60, 0), 1, cv2.LINE_AA)
    return tile


def main():
    image, outdir = sys.argv[1], sys.argv[2]
    x0, y0, x1, y1 = (int(v) for v in sys.argv[3:7])
    cols, rows = int(sys.argv[7]), int(sys.argv[8])
    min_len = int(sys.argv[9]) if len(sys.argv) > 9 else 40
    os.makedirs(outdir, exist_ok=True)
    bgr = cv2.imread(image, cv2.IMREAD_COLOR)
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    sat = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)[..., 1]
    # 손글씨(빨강)와 형광펜(주황)은 채도가 높다. 잉크에서 뺀다.
    ink = ((gray < 140) & (sat < 90)).astype(np.uint8) * 255
    roi = ink[y0:y1, x0:x1]
    result = {
        "vertical": find_segments(roi, True, min_len, x0, y0),
        "horizontal": find_segments(roi, False, min_len, x0, y0),
    }
    with open(os.path.join(outdir, "segments.json"), "w", encoding="utf-8") as f:
        json.dump(result, f)
    tw, th = (x1 - x0) // cols, (y1 - y0) // rows
    for r in range(rows):
        for c in range(cols):
            tx0, ty0 = x0 + c * tw, y0 + r * th
            tile = ruler_tile(bgr, gray, max(tx0 - 30, 0), max(ty0 - 30, 0), min(tx0 + tw + 30, bgr.shape[1]), min(ty0 + th + 30, bgr.shape[0]))
            cv2.imwrite(os.path.join(outdir, f"tile_r{r}c{c}.png"), tile)
    print("vertical", len(result["vertical"]), "horizontal", len(result["horizontal"]))


if __name__ == "__main__":
    main()
