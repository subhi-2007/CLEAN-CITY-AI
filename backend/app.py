
from fastapi import FastAPI, File, UploadFile
from ultralytics import YOLO
from PIL import Image
from fastapi.middleware.cors import CORSMiddleware
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = YOLO("best.pt")
print("YOLO class names:", model.names)


@app.get("/")
def home():
    return {"message": "Garbage Detection API is running"}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    width, height = image.size
    results = model.predict(
    image,
    conf=0.35,
    iou=0.30,
    max_det=100
)

    detections = []

    for result in results:
        for box in result.boxes:
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])
            x1, y1, x2, y2 = box.xyxy[0].tolist()

            detections.append({
                "class": model.names[class_id],
                "confidence": confidence,
                "box": [x1, y1, x2, y2],
            })

    return {
        "image_width": width,
        "image_height": height,
        "detections": detections,
    }
