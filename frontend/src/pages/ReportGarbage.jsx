
import { useEffect, useRef, useState } from "react";

function ReportGarbage() {
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);

  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageName, setImageName] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const [detection, setDetection] = useState(null);
  const [detecting, setDetecting] = useState(false);

  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  const [submitted, setSubmitted] = useState(false);

  // Draw all YOLO bounding boxes on the image
  const drawBoundingBox = () => {
    const image = imageRef.current;
    const canvas = canvasRef.current;

    if (!image || !canvas) return;

    const container = canvas.parentElement;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    canvas.width = containerWidth;
    canvas.height = containerHeight;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!image.complete || !image.naturalWidth) return;

    const imageWidth = image.naturalWidth;
    const imageHeight = image.naturalHeight;

    // Match the image's object-fit: contain layout
    const scale = Math.min(
      containerWidth / imageWidth,
      containerHeight / imageHeight
    );

    const displayedWidth = imageWidth * scale;
    const displayedHeight = imageHeight * scale;

    const offsetX = (containerWidth - displayedWidth) / 2;
    const offsetY = (containerHeight - displayedHeight) / 2;

    const boxes = detection?.detections || [];

    boxes.forEach((item) => {
      if (!item.box || item.box.length !== 4) return;

      const [x1, y1, x2, y2] = item.box;

      const boxX = offsetX + x1 * scale;
      const boxY = offsetY + y1 * scale;
      const boxWidth = (x2 - x1) * scale;
      const boxHeight = (y2 - y1) * scale;

      // Bounding rectangle
      // Choose a color based on the detected waste class
const wasteType = (item.type || "").toLowerCase();

let boxColor = "#22c55e"; // Default: green

if (wasteType.includes("plastic")) {
  boxColor = "#ef4444"; // Red
} else if (wasteType.includes("metal")) {
  boxColor = "#3b82f6"; // Blue
} else if (
  wasteType.includes("organic") ||
  wasteType.includes("biological") ||
  wasteType.includes("animal")
) {
  boxColor = "#f97316"; // Orange
} else if (
  wasteType.includes("glass")
) {
  boxColor = "#a855f7"; // Purple
} else if (
  wasteType.includes("paper")
) {
  boxColor = "#eab308"; // Yellow
}

// Bounding rectangle
ctx.strokeStyle = boxColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

      // Label
      const label = `${item.type} ${item.confidence}%`;
      ctx.font = "bold 13px Arial";

      const textWidth = ctx.measureText(label).width;
      const labelHeight = 23;
      const labelY = Math.max(0, boxY - labelHeight);

      ctx.fillStyle = boxColor;
      ctx.fillRect(
        boxX,
        labelY,
        textWidth + 12,
        labelHeight
      );

      ctx.fillStyle = "#ffffff";
      ctx.fillText(label, boxX + 6, labelY + 16);
    });
  };

  // Redraw boxes whenever the image or detections change
  useEffect(() => {
    if (imageRef.current?.complete) {
      drawBoundingBox();
    }
  }, [detection, selectedImage]);

  // Redraw boxes when the preview size changes
  useEffect(() => {
    const handleResize = () => drawBoundingBox();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [detection, selectedImage]);

  // Release the temporary image URL when it changes or the page unmounts
  useEffect(() => {
    return () => {
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
      }
    };
  }, [selectedImage]);

  // Handle image selection
  const handleImage = (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
    }

    const imageUrl = URL.createObjectURL(file);

    setSelectedImage(imageUrl);
    setSelectedFile(file);
    setImageName(file.name);

    setDetection(null);
    setSubmitted(false);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    handleImage(file);
    event.target.value = "";
  };

  // Drag-and-drop handlers
  const handleDragOver = (event) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);

    const file = event.dataTransfer.files[0];
    handleImage(file);
  };

  const chooseImage = () => {
    fileInputRef.current?.click();
  };

  // Remove selected image
  const removeImage = () => {
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
    }

    setSelectedImage(null);
    setSelectedFile(null);
    setImageName("");
    setDetection(null);
    setSubmitted(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Send the image to FastAPI and run YOLOv8
  const detectGarbage = async () => {
    if (!selectedFile) {
      alert("Please upload an image first.");
      return;
    }

    setDetecting(true);
    setDetection(null);
    setSubmitted(false);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/predict",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Prediction failed: ${response.status}`);
      }

      const data = await response.json();

      console.log("YOLOv8 prediction response:", data);

      const allDetections = (data.detections || []).map((item) => ({
        type: item.class,
        confidence: Math.round(item.confidence * 100),
        box: item.box,
      }));

      if (allDetections.length > 0) {
        setDetection({
          type: allDetections[0].type,
          confidence: allDetections[0].confidence,
          box: allDetections[0].box,
          detections: allDetections,
        });
      } else {
        setDetection({
          type: "No garbage detected",
          confidence: 0,
          box: null,
          detections: [],
        });
      }
    } catch (error) {
      console.error("Prediction error:", error);
      alert(
        "Unable to connect to the AI detection server. Make sure FastAPI is running at http://127.0.0.1:8000."
      );
    } finally {
      setDetecting(false);
    }
  };

  // Capture device location
  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(
        "Geolocation is not supported by your browser."
      );
      return;
    }

    setLocationLoading(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        setLocationLoading(false);
      },
      (error) => {
        setLocationLoading(false);

        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError(
              "Location permission denied. Please allow location access in your browser."
            );
            break;

          case error.POSITION_UNAVAILABLE:
            setLocationError(
              "Location information is unavailable."
            );
            break;

          case error.TIMEOUT:
            setLocationError(
              "Location request timed out. Please try again."
            );
            break;

          default:
            setLocationError(
              "Unable to retrieve your location."
            );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  // Submit report in this frontend prototype
  const submitReport = () => {
    if (!selectedFile) {
      alert("Please upload an image.");
      return;
    }

    if (!detection) {
      alert("Please detect the garbage before submitting.");
      return;
    }

    if (!location) {
      alert("Please get your location before submitting.");
      return;
    }

    setSubmitted(true);
  };

  return (
    <>
      <style>{`
        .report-page {
          min-height: calc(100vh - 72px);
          padding: 60px 8%;
          background:
            radial-gradient(circle at 80% 15%, rgba(22,163,74,.16), transparent 30%),
            linear-gradient(135deg, #061b14, #08281d);
          box-sizing: border-box;
        }

        .report-page * {
          box-sizing: border-box;
        }

        .report-container {
          max-width: 1100px;
          margin: 0 auto;
        }

        .report-header {
          margin-bottom: 35px;
        }

        .report-badge {
          display: inline-block;
          padding: 8px 15px;
          border: 1px solid #22c55e;
          border-radius: 30px;
          color: #86efac;
          background: #052e1b;
          font-size: 12px;
          font-weight: bold;
          letter-spacing: 1.4px;
        }

        .report-header h1 {
          margin: 20px 0 12px;
          font-size: 42px;
          color: #f0fdf4;
        }

        .report-header p {
          max-width: 700px;
          margin: 0;
          color: #a7c7b7;
          font-size: 16px;
          line-height: 1.8;
        }

        .report-grid {
          display: grid;
          grid-template-columns: 1.35fr .9fr;
          gap: 25px;
          align-items: start;
        }

        .report-card {
          min-width: 0;
          padding: 30px;
          background: rgba(11,47,35,.92);
          border: 1px solid #1b5e43;
          border-radius: 20px;
          box-shadow: 0 20px 55px rgba(0,0,0,.22);
        }

        .card-title {
          margin: 0 0 8px;
          color: #f0fdf4;
          font-size: 22px;
        }

        .card-description {
          margin: 0 0 25px;
          color: #9fc1b1;
          font-size: 14px;
          line-height: 1.7;
        }

        .upload-area {
          min-height: 330px;
          padding: 30px;
          border: 2px dashed #267653;
          border-radius: 16px;
          background: rgba(3,20,15,.55);
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          cursor: pointer;
          transition: .2s ease;
        }

        .upload-area:hover,
        .upload-area.active {
          border-color: #22c55e;
          background: rgba(22,163,74,.08);
        }

        .upload-content {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .upload-circle {
          width: 75px;
          height: 75px;
          margin-bottom: 18px;
          border-radius: 50%;
          background: #063d25;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 35px;
        }

        .upload-content h3 {
          margin: 0 0 8px;
          color: #f0fdf4;
          font-size: 20px;
        }

        .upload-content p {
          margin: 0 0 20px;
          color: #8fb5a4;
          font-size: 14px;
        }

        .choose-button,
        .detect-button,
        .location-button,
        .submit-button,
        .remove-button {
          border: none;
          cursor: pointer;
          font-weight: bold;
          transition: .2s ease;
        }

        .choose-button {
          padding: 12px 22px;
          border-radius: 9px;
          background: #16a34a;
          color: white;
          font-size: 14px;
        }

        .choose-button:hover,
        .detect-button:hover,
        .submit-button:hover {
          background: #22c55e;
          transform: translateY(-1px);
        }

        .hidden-input {
          display: none;
        }

        .preview-wrapper {
          position: relative;
          height: 330px;
          border-radius: 16px;
          overflow: hidden;
          background: #03140f;
          border: 1px solid #1b5e43;
        }

        .preview-image {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: contain;
          background: #03140f;
        }

        .bounding-box-canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 2;
        }

        .preview-overlay {
          position: absolute;
          left: 15px;
          right: 15px;
          bottom: 15px;
          padding: 12px 15px;
          border-radius: 10px;
          background: rgba(3,20,15,.88);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          z-index: 3;
        }

        .file-name {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #d1fae5;
          font-size: 13px;
        }

        .remove-button {
          flex-shrink: 0;
          padding: 8px 12px;
          border-radius: 7px;
          background: #163c2d;
          color: #fca5a5;
          font-size: 12px;
        }

        .remove-button:hover {
          background: #522727;
        }

        .action-section {
          margin-top: 25px;
        }

        .detect-button {
          width: 100%;
          padding: 14px 20px;
          border-radius: 10px;
          background: #16a34a;
          color: white;
          font-size: 15px;
        }

        .detect-button:disabled,
        .location-button:disabled,
        .submit-button:disabled {
          opacity: .55;
          cursor: not-allowed;
          transform: none;
        }

        .result-box {
          margin-top: 20px;
          padding: 20px;
          border: 1px solid #236f4d;
          border-radius: 14px;
          background: #06261a;
        }

        .result-label {
          margin: 0 0 6px;
          color: #86efac;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .result-type {
          margin: 0 0 15px;
          color: #f0fdf4;
          font-size: 25px;
        }

        .confidence-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          color: #b9d5c7;
          font-size: 13px;
        }

        .confidence-bar {
          height: 8px;
          overflow: hidden;
          border-radius: 20px;
          background: #12382a;
        }

        .confidence-fill {
          height: 100%;
          border-radius: 20px;
          background: #22c55e;
        }

        .detection-list {
          display: grid;
          gap: 9px;
          margin-top: 18px;
        }

        .detection-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 11px 12px;
          border: 1px solid #174d3a;
          border-radius: 9px;
          color: #d1fae5;
          font-size: 13px;
        }

        .detection-item span:last-child {
          color: #86efac;
          font-weight: bold;
          white-space: nowrap;
        }

        .side-section {
          margin-bottom: 25px;
        }

        .side-title {
          margin: 0 0 8px;
          color: #f0fdf4;
          font-size: 18px;
        }

        .side-description {
          margin: 0 0 16px;
          color: #8fb5a4;
          font-size: 13px;
          line-height: 1.6;
        }

        .location-button {
          width: 100%;
          padding: 13px 18px;
          border-radius: 9px;
          background: #0d5138;
          color: #d1fae5;
          border: 1px solid #267653;
          font-size: 14px;
        }

        .location-button:hover {
          background: #116746;
        }

        .location-data {
          margin-top: 15px;
          padding: 16px;
          border-radius: 12px;
          background: #06261a;
          border: 1px solid #236f4d;
        }

        .coordinate {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          padding: 8px 0;
          border-bottom: 1px solid #174d3a;
        }

        .coordinate:last-child {
          border-bottom: none;
        }

        .coordinate span:first-child {
          color: #8fb5a4;
          font-size: 13px;
        }

        .coordinate span:last-child {
          color: #d1fae5;
          font-size: 13px;
          font-weight: bold;
          text-align: right;
        }

        .error-message {
          margin-top: 12px;
          padding: 12px;
          border-radius: 9px;
          background: rgba(127,29,29,.25);
          border: 1px solid #7f3030;
          color: #fca5a5;
          font-size: 12px;
          line-height: 1.5;
        }

        .submit-section {
          margin-top: 25px;
          padding-top: 25px;
          border-top: 1px solid #174d3a;
        }

        .submit-button {
          width: 100%;
          padding: 15px 20px;
          border-radius: 10px;
          background: #16a34a;
          color: white;
          font-size: 15px;
        }

        .success-box {
          margin-top: 15px;
          padding: 15px;
          border-radius: 10px;
          background: rgba(22,163,74,.12);
          border: 1px solid #267653;
          color: #86efac;
          font-size: 13px;
          line-height: 1.6;
        }

        .flow-note {
          margin-top: 25px;
          padding: 15px;
          border-radius: 12px;
          background: rgba(3,20,15,.45);
          border: 1px solid #174d3a;
          color: #7fa998;
          font-size: 12px;
          line-height: 1.6;
        }

        @media (max-width: 850px) {
          .report-page {
            padding: 45px 6%;
          }

          .report-grid {
            grid-template-columns: 1fr;
          }

          .report-header h1 {
            font-size: 36px;
          }
        }

        @media (max-width: 500px) {
          .report-page {
            padding: 35px 5%;
          }

          .report-card {
            padding: 20px;
          }

          .report-header h1 {
            font-size: 30px;
          }

          .upload-area {
            min-height: 260px;
          }

          .preview-wrapper {
            height: 260px;
          }

          .preview-overlay {
            flex-direction: column;
            align-items: stretch;
          }

          .coordinate {
            flex-direction: column;
            gap: 4px;
          }

          .coordinate span:last-child {
            text-align: left;
          }
        }
      `}</style>

      <main className="report-page">
        <div className="report-container">
          <div className="report-header">
            <span className="report-badge">CLEAN CITY AI</span>

            <h1>Report Illegal Garbage</h1>

            <p>
              Upload a photo of illegally dumped garbage. Our AI
              will identify the waste, and your location can be
              attached to the report for authorities.
            </p>
          </div>

          <div className="report-grid">
            <section className="report-card">
              <h2 className="card-title">Upload Garbage Image</h2>

              <p className="card-description">
                Choose a clear image or drag and drop it below.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden-input"
                onChange={handleFileChange}
              />

              {!selectedImage ? (
                <div
                  className={`upload-area ${dragActive ? "active" : ""}`}
                  onClick={chooseImage}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="upload-content">
                    <div className="upload-circle">📷</div>
                    <h3>Drop your image here</h3>
                    <p>JPG, PNG or other image formats</p>

                    <button
                      type="button"
                      className="choose-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        chooseImage();
                      }}
                    >
                      Choose Image
                    </button>
                  </div>
                </div>
              ) : (
                <div className="preview-wrapper">
                  <img
                    ref={imageRef}
                    src={selectedImage}
                    alt="Selected garbage"
                    className="preview-image"
                    onLoad={drawBoundingBox}
                  />

                  <canvas
                    ref={canvasRef}
                    className="bounding-box-canvas"
                  />

                  <div className="preview-overlay">
                    <span className="file-name">{imageName}</span>

                    <button
                      type="button"
                      className="remove-button"
                      onClick={removeImage}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              <div className="action-section">
                <button
                  type="button"
                  className="detect-button"
                  onClick={detectGarbage}
                  disabled={!selectedFile || detecting}
                >
                  {detecting ? "Analyzing Image..." : "Detect Garbage"}
                </button>

                {detection && (
                  <div className="result-box">
                    <p className="result-label">AI Detection Result</p>
                    <h3 className="result-type">{detection.type}</h3>

                    {detection.detections?.length > 0 && (
                      <>
                        <div className="confidence-row">
                          <span>First detection confidence</span>
                          <strong>{detection.confidence}%</strong>
                        </div>

                        <div className="confidence-bar">
                          <div
                            className="confidence-fill"
                            style={{ width: `${detection.confidence}%` }}
                          />
                        </div>

                        <div className="detection-list">
                          <p className="result-label">
                            All detected objects ({detection.detections.length})
                          </p>

                          {detection.detections.map((item, index) => (
                            <div
                              className="detection-item"
                              key={`${item.type}-${index}`}
                            >
                              <span>{index + 1}. {item.type}</span>
                              <span>{item.confidence}%</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </section>

            <section className="report-card">
              <div className="side-section">
                <h2 className="side-title">📍 Location</h2>

                <p className="side-description">
                  Capture your device's current location to associate
                  the garbage report with coordinates.
                </p>

                <button
                  type="button"
                  className="location-button"
                  onClick={getLocation}
                  disabled={locationLoading}
                >
                  {locationLoading ? "Getting Location..." : "Get My Location"}
                </button>

                {location && (
                  <div className="location-data">
                    <div className="coordinate">
                      <span>Latitude</span>
                      <span>{location.latitude.toFixed(6)}</span>
                    </div>

                    <div className="coordinate">
                      <span>Longitude</span>
                      <span>{location.longitude.toFixed(6)}</span>
                    </div>

                    <p className="side-description" style={{ marginTop: 12, marginBottom: 0 }}>
                      <a
                        href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#86efac" }}
                      >
                        View location on Google Maps
                      </a>
                    </p>
                  </div>
                )}

                {locationError && (
                  <div className="error-message">{locationError}</div>
                )}
              </div>

              <div className="submit-section">
                <h2 className="side-title">Submit Report</h2>

                <p className="side-description">
                  Review your image, AI detections and coordinates
                  before submitting.
                </p>

                <button
                  type="button"
                  className="submit-button"
                  onClick={submitReport}
                  disabled={!selectedFile || !detection || !location || submitted}
                >
                  {submitted ? "Report Submitted ✓" : "Submit Report"}
                </button>

                {submitted && (
                  <div className="success-box">
                    Your report has been marked as submitted in this
                    frontend prototype. It has not been saved to the
                    backend database yet.
                  </div>
                )}
              </div>

              <div className="flow-note">
                AI model: trained YOLOv8 object detector
                <br />
                Backend: FastAPI
                <br />
                Detection threshold: 35% confidence
                <br />
                GPS: browser geolocation
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

export default ReportGarbage;
