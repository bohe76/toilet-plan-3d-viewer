"""스캔 도면 PDF를 기울기 보정한 이미지로 변환한다.

사용: python scripts/prep_plans.py <pdf> <public_dir> <work_dir>
출력:
  <public_dir>/plan_N.jpg   200dpi, 뷰어 바닥 도면용
  <public_dir>/plans.json   페이지별 기울기 각도와 이미지 크기
  <work_dir>/plan_N.jpg     300dpi, 치수 측정용 (measure_plan.py 입력)
"""
import json
import math
import os
import sys

import cv2
import numpy as np
import pymupdf

WORK_DPI = 300
PUBLIC_DPI = 200


def render_bgr(page, dpi):
    pix = page.get_pixmap(dpi=dpi, alpha=False)
    img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
    return cv2.cvtColor(img, cv2.COLOR_RGB2BGR)


def measure_skew_deg(bgr):
    """긴 수평선의 기울기(도). 오른쪽으로 갈수록 내려가면 양수다."""
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    small = cv2.resize(gray, None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA)
    bw = (small < 150).astype(np.uint8) * 255
    lines = cv2.HoughLines(
        bw, 1, np.pi / 7200, small.shape[1] // 4,
        min_theta=np.pi / 2 - 0.05, max_theta=np.pi / 2 + 0.05,
    )
    if lines is None:
        return 0.0
    thetas = [float(l[0][1]) for l in lines[:25]]
    return math.degrees(float(np.median(thetas)) - math.pi / 2)


def rotate(bgr, deg):
    h, w = bgr.shape[:2]
    m = cv2.getRotationMatrix2D((w / 2, h / 2), deg, 1.0)
    return cv2.warpAffine(bgr, m, (w, h), flags=cv2.INTER_CUBIC, borderValue=(255, 255, 255))


def deskew(bgr):
    skew = measure_skew_deg(bgr)
    best = (abs(skew), 0.0, bgr)
    for sign in (1, -1):
        out = rotate(bgr, sign * skew)
        residual = abs(measure_skew_deg(out))
        if residual < best[0]:
            best = (residual, sign * skew, out)
    return best[2], skew, best[1], best[0]


def main():
    pdf, public_dir, work_dir = sys.argv[1], sys.argv[2], sys.argv[3]
    os.makedirs(public_dir, exist_ok=True)
    os.makedirs(work_dir, exist_ok=True)
    doc = pymupdf.open(pdf)
    meta = []
    for i in range(doc.page_count):
        n = i + 1
        fixed, skew, applied, residual = deskew(render_bgr(doc[i], WORK_DPI))
        cv2.imwrite(os.path.join(work_dir, f"plan_{n}.jpg"), fixed, [cv2.IMWRITE_JPEG_QUALITY, 95])
        scale = PUBLIC_DPI / WORK_DPI
        pub = cv2.resize(fixed, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
        cv2.imwrite(os.path.join(public_dir, f"plan_{n}.jpg"), pub, [cv2.IMWRITE_JPEG_QUALITY, 85])
        meta.append({
            "page": n, "skewDeg": round(skew, 3), "appliedDeg": round(applied, 3),
            "residualDeg": round(residual, 3), "width": pub.shape[1], "height": pub.shape[0], "dpi": PUBLIC_DPI,
        })
        print(meta[-1])
    with open(os.path.join(public_dir, "plans.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=1)


if __name__ == "__main__":
    main()
