import requests
import cv2
import numpy as np

# Create a dummy image (black image = clean)
clean_img = np.zeros((640, 640, 3), dtype=np.uint8)
cv2.imwrite("clean_test.jpg", clean_img)

# Create a dummy image (with some random noise - unlikely to be garbage, but let's test)
# Ideally I'd need a real garbage image, but I can't easily generate one that YOLO will definitely classify as garbage without a real model/image.
# However, "clean" image should definitely return resolved=True.

url = "http://127.0.0.1:8000/verify-resolution"

def test_clean_image():
    with open("clean_test.jpg", "rb") as f:
        files = {"file": f}
        try:
            response = requests.post(url, files=files)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.json()}")
        except Exception as e:
            print(f"Failed to connect: {e}")

if __name__ == "__main__":
    print("Testing clean image verification...")
    test_clean_image()
