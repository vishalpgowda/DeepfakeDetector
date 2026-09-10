from flask import Flask, request, jsonify
from flask_cors import CORS

import torch
import torch.nn.functional as F

from PIL import Image
from torchvision.models import efficientnet_b0
from torchvision import transforms

import os


# =========================================================
# FLASK APP
# =========================================================

app = Flask(__name__)
CORS(app)


# =========================================================
# MODEL PATH
# =========================================================

MODEL_PATH = "models/best_model-v3.pt"

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# =========================================================
# LOAD MODEL
# =========================================================

def load_model():

    print("Loading Deepfake Detection Model...")

    model = efficientnet_b0(weights=None)

    # Two classes:
    # 0 = Real
    # 1 = Deepfake

    model.classifier[1] = torch.nn.Linear(
        model.classifier[1].in_features,
        2
    )

    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Model file not found: {MODEL_PATH}"
        )

    checkpoint = torch.load(
        MODEL_PATH,
        map_location=device
    )

    # Handle different checkpoint formats
    if isinstance(checkpoint, dict):

        if "state_dict" in checkpoint:
            state_dict = checkpoint["state_dict"]

        elif "model_state_dict" in checkpoint:
            state_dict = checkpoint["model_state_dict"]

        else:
            state_dict = checkpoint

    else:
        state_dict = checkpoint


    # Remove possible "model." prefix
    cleaned_state_dict = {}

    for key, value in state_dict.items():

        if key.startswith("model."):
            key = key[6:]

        cleaned_state_dict[key] = value


    model.load_state_dict(
        cleaned_state_dict,
        strict=False
    )

    model.to(device)

    model.eval()

    print("Model loaded successfully.")
    print("Device:", device)

    return model


model = load_model()


# =========================================================
# IMAGE PREPROCESSING
# =========================================================

transform = transforms.Compose([

    transforms.Resize((224, 224)),

    transforms.ToTensor(),

    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )

])


# =========================================================
# PREDICT IMAGE
# =========================================================

def predict_image(image):

    image = image.convert("RGB")

    image_tensor = transform(image)

    image_tensor = image_tensor.unsqueeze(0)

    image_tensor = image_tensor.to(device)


    with torch.no_grad():

        output = model(image_tensor)

        probabilities = F.softmax(
            output,
            dim=1
        )

        confidence, predicted_class = torch.max(
            probabilities,
            dim=1
        )


    predicted_class = predicted_class.item()

    confidence = confidence.item() * 100


    if predicted_class == 0:

        prediction = "REAL"

    else:

        prediction = "DEEPFAKE"


    return prediction, round(confidence, 2)


# =========================================================
# PREDICT API
# =========================================================

@app.route("/predict", methods=["POST"])
def predict():

    try:

        if "file" not in request.files:

            return jsonify({
                "success": False,
                "error": "No file uploaded."
            }), 400


        file = request.files["file"]


        if file.filename == "":

            return jsonify({
                "success": False,
                "error": "No file selected."
            }), 400


        # -------------------------------------------------
        # IMAGE
        # -------------------------------------------------

        if file.content_type.startswith("image/"):

            image = Image.open(file)

            prediction, confidence = predict_image(
                image
            )


            return jsonify({

                "success": True,

                "prediction": prediction,

                "confidence": confidence

            })


        # -------------------------------------------------
        # VIDEO
        # -------------------------------------------------

        elif file.content_type.startswith("video/"):

            import cv2
            import tempfile


            suffix = os.path.splitext(
                file.filename
            )[1]


            with tempfile.NamedTemporaryFile(
                delete=False,
                suffix=suffix
            ) as temp:

                file.save(temp.name)

                video_path = temp.name


            try:

                cap = cv2.VideoCapture(
                    video_path
                )


                success, frame = cap.read()

                cap.release()


                if not success:

                    return jsonify({

                        "success": False,

                        "error":
                        "Unable to read video."

                    }), 400


                frame = cv2.cvtColor(
                    frame,
                    cv2.COLOR_BGR2RGB
                )


                image = Image.fromarray(
                    frame
                )


                prediction, confidence = predict_image(
                    image
                )


                return jsonify({

                    "success": True,

                    "prediction": prediction,

                    "confidence": confidence

                })


            finally:

                if os.path.exists(video_path):

                    os.remove(video_path)


        # -------------------------------------------------
        # INVALID FILE
        # -------------------------------------------------

        else:

            return jsonify({

                "success": False,

                "error":
                "Only image and video files are supported."

            }), 400


    except Exception as e:

        print("Prediction error:", e)

        return jsonify({

            "success": False,

            "error": str(e)

        }), 500


# =========================================================
# HOME
# =========================================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({

        "message":
        "Deepfake Detector API is running.",

        "status":
        "active"

    })


# =========================================================
# RUN SERVER
# =========================================================

if __name__ == "__main__":

    print()
    print("======================================")
    print("   DEEPFAKE DETECTOR FLASK SERVER")
    print("======================================")
    print("Server: http://127.0.0.1:5000")
    print("Prediction API: /predict")
    print("======================================")
    print()

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )