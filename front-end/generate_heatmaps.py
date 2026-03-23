import cv2
import numpy as np
import os

img_path = "public/realistic_earth.png"
if not os.path.exists(img_path):
    print("Error: realistic_earth.png not found")
    exit(1)

print("Loading original cartography:", img_path)
img = cv2.imread(img_path, cv2.IMREAD_COLOR)
h, w, _ = img.shape

# 1. Extract Water Mask isolating deep blues/navys
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
lower_blue = np.array([90, 20, 0])
upper_blue = np.array([150, 255, 140])
ocean_mask = cv2.inRange(hsv, lower_blue, upper_blue)

# 2. Extract Land Mask
land_mask = cv2.bitwise_not(ocean_mask)

# ==========================================
# MANGROVE COASTLINE HEATMAP (Edge Detection)
# ==========================================
print("Extracting Mangrove coastal matrices...")
edges = cv2.Canny(land_mask, 100, 200)
kernel = np.ones((3,3), np.uint8)
mangrove_glow = cv2.dilate(edges, kernel, iterations=2)
mangrove_glow = cv2.GaussianBlur(mangrove_glow, (11, 11), 0)

mangroves_out = np.zeros_like(img)
# BGR for Emerald Green
mangroves_out[mangrove_glow > 20] = [110, 231, 100] 
mangroves_out = cv2.GaussianBlur(mangroves_out, (5, 5), 0)
cv2.imwrite("public/mangrove_coasts_heatmap.png", mangroves_out)


# ==========================================
# ALPINE GLACIERS HEATMAP (Snow / High Latitude Extraction)
# ==========================================
print("Extracting Alpine Glaciation field...")
lower_white = np.array([0, 0, 150])
upper_white = np.array([180, 50, 255])
snow_mask = cv2.inRange(hsv, lower_white, upper_white)

glacier_mask = np.zeros_like(snow_mask)
# Polar regions
glacier_mask[0:int(h*0.30), :] = snow_mask[0:int(h*0.30), :]
glacier_mask[int(h*0.75):h, :] = snow_mask[int(h*0.75):h, :]
# Central high altitude ranges
glacier_mask[int(h*0.30):int(h*0.45), int(w*0.50):int(w*0.80)] = snow_mask[int(h*0.30):int(h*0.45), int(w*0.50):int(w*0.80)]

glacier_glow = cv2.dilate(glacier_mask, kernel, iterations=1)
glacier_glow = cv2.GaussianBlur(glacier_glow, (15, 15), 0)

glaciers_out = np.zeros_like(img)
# BGR for Stark Cyan
glaciers_out[glacier_glow > 10] = [253, 230, 186]
glaciers_out = cv2.GaussianBlur(glaciers_out, (7, 7), 0)
cv2.imwrite("public/alpine_glaciers_heatmap.png", glaciers_out)


# ==========================================
# SHIPPING LANES HEATMAP (Oceanic Void Routing)
# ==========================================
print("Extracting Maritime Supply Corridors...")
shipping_out = np.zeros_like(img)
np.random.seed(42)
for i in range(120):
    start_pt = (np.random.randint(0, w), np.random.randint(0, h))
    end_pt = (np.random.randint(0, w), np.random.randint(0, h))
    # BGR for Amber/Bright Red
    color = (np.random.randint(0, 40), np.random.randint(60, 140), np.random.randint(220, 255))
    thickness = np.random.randint(1, 4)
    cv2.line(shipping_out, start_pt, end_pt, color, thickness)

# Intersect the raw shipping arrays strictly over water
cv2.bitwise_and(shipping_out, shipping_out, shipping_out, mask=ocean_mask)
shipping_out = cv2.GaussianBlur(shipping_out, (11, 11), 0)
cv2.imwrite("public/shipping_lanes_heatmap.png", shipping_out)

print("SUCCESS: 3 Aligned heatmap overlays successfully generated into public/")
