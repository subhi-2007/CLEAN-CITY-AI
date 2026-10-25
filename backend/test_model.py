
from ultralytics import YOLO

# Load your trained model
model = YOLO("best.pt")

# Test an image containing multiple garbage objects
results = model.predict(
    source="test.jpg",
    conf=0.15,
    imgsz=960,
    iou=0.5,
    save=True
)

# Print every detection
for result in results:
    print("Total detections:", len(result.boxes))

    for box in result.boxes:
        class_id = int(box.cls[0])
        confidence = float(box.conf[0])
        print(
            model.names[class_id],
            round(confidence * 100, 2), "%"
         )


# from ultralytics import YOLO
# from pathlib import Path

# model = YOLO("best.pt")

# image_path = input("Enter the full path of your test image: ").strip().strip('"')

# if not Path(image_path).is_file():
#     print("Image file not found. Check the path and try again.")
#     raise SystemExit(1)

# results = model.predict(
#     source=image_path,
#     conf=0.25,
#     iou=0.30,
#     imgsz=1024,
#     max_det=100,
#     verbose=False
# )

# for result in results:
#     print("\nDetected objects:")
#     if result.boxes is None or len(result.boxes) == 0:
#         print("No objects detected.")
#         continue

#     for box in result.boxes:
#         class_id = int(box.cls[0])
#         confidence = float(box.conf[0])
#         x1, y1, x2, y2 = box.xyxy[0].tolist()
#         print(
#             f"Class: {model.names[class_id]} | "
#             f"Confidence: {confidence:.2%} | "
#             f"Box: {[round(v, 1) for v in (x1, y1, x2, y2)]}"
#         )

#     result.save(filename="test_result.jpg")
#     print("Annotated image saved as test_result.jpg")
