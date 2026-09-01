import "./style.css";

document.querySelector("#app").innerHTML = `
    <header>
        <h1>🤖 FakeFace Detector</h1>
        <p>Deepfake Image & Video Detection System</p>

        <a href="/dashboard.html" class="dashboard-btn">
            📊 Dashboard
        </a>
    </header>

    <div class="container">

        <div class="card">

            <h2>Upload Image or Video</h2>

            <input
                type="file"
                id="fileInput"
                accept="image/*,video/*"
            >

            <div id="preview"></div>

            <button id="analyzeButton">
                Analyze
            </button>

            <div id="loading" class="loading">
                🔍 AI is analyzing...
            </div>

            <div id="result"></div>

        </div>

    </div>

    <footer>
        © 2026 FakeFace Detector | AI Project
    </footer>
`;

// Get HTML elements
const fileInput = document.getElementById("fileInput");
const preview = document.getElementById("preview");
const loading = document.getElementById("loading");
const result = document.getElementById("result");
const analyzeButton = document.getElementById("analyzeButton");


// ==========================================
// FILE PREVIEW
// ==========================================

fileInput.addEventListener("change", function () {

    preview.innerHTML = "";
    result.innerHTML = "";

    const file = this.files[0];

    if (!file) {
        return;
    }

    const url = URL.createObjectURL(file);

    // Image preview
    if (file.type.startsWith("image")) {

        const img = document.createElement("img");

        img.src = url;
        img.style.maxWidth = "100%";

        preview.appendChild(img);
    }

    // Video preview
    else if (file.type.startsWith("video")) {

        const video = document.createElement("video");

        video.src = url;
        video.controls = true;
        video.style.maxWidth = "100%";

        preview.appendChild(video);
    }

});


// ==========================================
// SEND IMAGE TO AI BACKEND
// ==========================================

analyzeButton.addEventListener("click", analyzeFile);

async function analyzeFile() {

    // Check file
    if (fileInput.files.length === 0) {

        alert("Please upload an image.");

        return;
    }

    const file = fileInput.files[0];

    // Current backend supports images
    if (!file.type.startsWith("image")) {

        alert(
            "Please upload an image. " +
            "Video detection will be connected next."
        );

        return;
    }

    // Show loading
    loading.style.display = "block";

    result.innerHTML = "";

    try {

        // Create form data
        const formData = new FormData();

        formData.append("file", file);


        // Send image to Flask API
        const response = await fetch(
            "http://127.0.0.1:5000/predict",
            {
                method: "POST",
                body: formData
            }
        );


        // Convert API response to JSON
        const data = await response.json();


        // Hide loading
        loading.style.display = "none";


        // Display result
        if (data.success) {

            if (data.prediction === "REAL") {

                result.innerHTML =
                    "Prediction: REAL<br>" +
                    "Confidence: " +
                    data.confidence +
                    "%";

                result.className = "real";

            } else {

                result.innerHTML =
                    "Prediction: DEEPFAKE<br>" +
                    "Confidence: " +
                    data.confidence +
                    "%";

                result.className = "fake";
            }

        } else {

            result.innerHTML =
                "Error: " +
                data.error;

            result.className = "fake";
        }

    }

    catch (error) {

        loading.style.display = "none";

        result.innerHTML =
            "Unable to connect to AI server.<br>" +
            "Make sure the Flask API is running.";

        result.className = "fake";

        console.error("API Error:", error);
    }

}