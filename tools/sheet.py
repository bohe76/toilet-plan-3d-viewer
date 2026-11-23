# 캡처 여러 장의 같은 영역을 잘라서 한 장으로 붙인다.
#   python sheet.py <출력 png> <x0,y0,x1,y1> <열 수> <라벨=경로> ...
import sys

import cv2
import numpy as np

out, box, cols = sys.argv[1], [int(v) for v in sys.argv[2].split(',')], int(sys.argv[3])
x0, y0, x1, y1 = box
tiles = []
for item in sys.argv[4:]:
    label, path = item.split('=', 1)
    img = cv2.imdecode(np.fromfile(path, dtype=np.uint8), cv2.IMREAD_COLOR)
    crop = img[y0:y1, x0:x1].copy()
    cv2.rectangle(crop, (0, 0), (len(label) * 13 + 12, 26), (0, 0, 0), -1)
    cv2.putText(crop, label, (6, 19), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1, cv2.LINE_AA)
    tiles.append(crop)
while len(tiles) % cols:
    tiles.append(np.zeros_like(tiles[0]))
rows = [np.hstack(tiles[i:i + cols]) for i in range(0, len(tiles), cols)]
sheet = np.vstack(rows)
cv2.imencode('.png', sheet)[1].tofile(out)
print(out, sheet.shape)
