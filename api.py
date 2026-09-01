from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
from PIL import Image
from torchvision.models import efficientnet_b0
from torchvision import transforms
import os

app = Flask(__name__)
CORS(app)

# =========================
# Load Deepfake Model
# =========================

MODEL_PATH = "models/best_model-v3.pt"

def load_model():
    print("Loading deepfake detection model...")

    model = efficientnet_b0()

    # 2 classes:
    # 0 = Real
    # 1 = Deepfake
    model.classifier[1] = torch.nn.Linear(
        model.classifier[1].in_features,
        2
    )

    model.load_state_dict(
        torch.load(MODEL_PATH, map_location="cpu")
    )

    model.eval()

    print("Model loaded successfully!")

    return model


model = load_model()


# =========================
# Image Preprocessing
# =========================

preprocess = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


# =========================
# Prediction Function
# =========================

def predict_image(image):

    image = image.convert("RGB")

    tensor = preprocess(image).unsqueeze(0)

    with torch.no_grad():

        output = model(tensor)

        probabilities = torch.softmax(output, dim=1)[0]

        confidence, prediction = torch.max(
            probabilities,
            dim=0
        )

    prediction = prediction.item()
    confidence = confidence.item() * 100

    if prediction == 0:
        label = "REAL"
    else:
        label = "DEEPFAKE"

    return label, confidence


# =========================
# API Route
# =========================

@app.route("/predict", methods=["POST"])
def predict():

    try:

        if "file" not in request.files:

            return jsonify({
                "success": False,
                "error": "No file uploaded"
            }), 400

        file = request.files["file"]

        if file.filename == "":

            return jsonify({
                "success": False,
                "error": "No file selected"
            }), 400

        # Open uploaded image
        image = Image.open(file.stream)

        # Run prediction
        label, confidence = predict_image(image)

        return jsonify({
            "success": True,
            "prediction": label,
            "confidence": round(confidence, 2)
        })

    except Exception as e:

        print("ERROR:", e)

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# =========================
# Home Route
# =========================

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "message": "Deepfake Detector API is running!"
    })


# =========================
# Start Server
# =========================

if __name__ == "__main__":

    print("")
    print("===================================")
    print("   DEEPFAKE DETECTOR API")
    print("===================================")
    print("")
    print("Server running at:")
    print("http://127.0.0.1:5000")
    print("")

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )