import "./style.css";

document.querySelector("#app").innerHTML = `
    <header class="top-header">

        <div class="logo">
            🤖 DEEPFAKE DETECTOR
        </div>

        <a href="/dashboard.html" class="dashboard-btn">
            ▦ &nbsp; Dashboard
        </a>

    </header>


    <main class="detector">

        <h1>Deepfake Detector</h1>

        <p class="subtitle">
            Upload an image and click analyze to detect whether it is real or fake.
        </p>


        <div class="detector-card">

            <div class="upload-area">

                <div class="upload-icon">
                    ☁
                </div>

                <h2>Upload an Image</h2>

                <p>Click to choose an image</p>

                <input
                    type="file"
                    id="fileInput"
                    accept="image/*"
                >

                <label for="fileInput" class="choose-btn">
                    Choose Image
                </label>

                <div id="preview"></div>

            </div>


            <button id="analyzeButton" class="analyze-btn">
                🔍 &nbsp; Analyze Image
            </button>


            <hr>


            <div class="result-section">

                <h3>Prediction</h3>

                <div id="prediction">
                    --
                </div>


                <h3>Confidence</h3>

                <div id="confidence">
                    -- %
                </div>

            </div>

        </div>

    </main>
`;


const fileInput = document.getElementById("fileInput");
const preview = document.getElementById("preview");
const analyzeButton = document.getElementById("analyzeButton");
const prediction = document.getElementById("prediction");
const confidence = document.getElementById("confidence");


fileInput.addEventListener("change", function () {

    preview.innerHTML = "";

    const file = this.files[0];

    if (!file) {
        return;
    }

    const image = document.createElement("img");

    image.src = URL.createObjectURL(file);

    preview.appendChild(image);
});


analyzeButton.addEventListener("click", async function () {

    if (!fileInput.files.length) {

        alert("Please select an image.");

        return;
    }

    const file = fileInput.files[0];

    prediction.textContent = "Analyzing...";
    confidence.textContent = "-- %";


    const formData = new FormData();

    formData.append("file", file);


    try {

        const response = await fetch(
            "http://127.0.0.1:5000/predict",
            {
                method: "POST",
                body: formData
            }
        );


        const data = await response.json();


        if (data.success) {

            prediction.textContent = data.prediction;

            confidence.textContent =
                data.confidence + " %";


            if (data.prediction === "REAL") {

                prediction.className = "real";

            } else {

                prediction.className = "fake";

            }

        } else {

            prediction.textContent = "Error";
            confidence.textContent = "-- %";

            alert(data.error);

        }

    } catch (error) {

        prediction.textContent = "Connection Error";
        confidence.textContent = "-- %";

        alert(
            "Unable to connect to AI server. " +
            "Please make sure Flask is running."
        );

        console.error(error);
    }

});