import "./style.css";

document.querySelector("#app").innerHTML = `
<header class="top-header">

    <div class="logo">
        🤖 DEEPFAKE DETECTOR
    </div>

    <a href="/dashboard.html" class="dashboard-btn">
        🏠 &nbsp; Dashboard
    </a>

</header>

<main class="detector">

    <h1>📤 Upload Media</h1>

    <p class="subtitle">
        Upload an image or video and click analyze to detect whether it is real or fake.
    </p>

    <div class="detector-card">

        <div class="upload-area">

            <div class="upload-icon">
                ☁️
            </div>

            <h2>Upload Media</h2>

            <p>
                Select an image or video to analyze for possible deepfake content.
            </p>

            <input
                type="file"
                id="fileInput"
                accept="image/*,video/*"
            >

            <label
                for="fileInput"
                class="choose-btn"
            >
                📁 Choose Image / Video
            </label>

            <div id="preview"></div>

        </div>

        <button
            id="analyzeButton"
            class="analyze-btn"
        >
            🔍 &nbsp; Analyze Media
        </button>

        <div class="result-section">

            <h3>Prediction</h3>

            <h3>Confidence</h3>

            <div
                id="prediction"
                class="prediction"
            >
                --
            </div>

            <div
                id="confidence"
                class="confidence"
            >
                -- %
            </div>

        </div>

        <div
            id="status"
            class="status"
        ></div>

    </div>

</main>
`;

const fileInput = document.getElementById("fileInput");
const preview = document.getElementById("preview");
const analyzeButton = document.getElementById("analyzeButton");
const prediction = document.getElementById("prediction");
const confidence = document.getElementById("confidence");
const status = document.getElementById("status");


/* =========================================================
   LOAD SELECTED FILE
========================================================= */

fileInput.addEventListener("change", function () {

    preview.innerHTML = "";

    prediction.textContent = "--";
    confidence.textContent = "-- %";

    prediction.className = "prediction";
    confidence.className = "confidence";

    status.textContent = "";
    status.className = "status";

    const file = this.files[0];

    if (!file) {
        return;
    }

    /* Check file type */

    if (
        !file.type.startsWith("image/") &&
        !file.type.startsWith("video/")
    ) {

        alert("Please select an image or video file.");

        fileInput.value = "";

        return;
    }


    /* IMAGE PREVIEW */

    if (file.type.startsWith("image/")) {

        const image = document.createElement("img");

        image.src = URL.createObjectURL(file);

        image.alt = "Selected Image";

        preview.appendChild(image);

    }


    /* VIDEO PREVIEW */

    else if (file.type.startsWith("video/")) {

        const video = document.createElement("video");

        video.src = URL.createObjectURL(file);

        video.controls = true;

        video.muted = true;

        video.style.maxWidth = "100%";

        video.style.maxHeight = "300px";

        preview.appendChild(video);
    }

});


/* =========================================================
   SAVE ANALYSIS RESULT
========================================================= */

function saveAnalysisResult(file, result, confidenceValue) {

    let history = [];

    try {

        history =
            JSON.parse(
                localStorage.getItem("deepfakeAnalysisHistory")
            ) || [];

    } catch (error) {

        history = [];
    }


    const mediaType =
        file.type.startsWith("video/")
            ? "video"
            : "image";


    const isFake =
        result.toUpperCase().includes("FAKE");


    const analysis = {

        id: Date.now(),

        fileName: file.name,

        mediaType: mediaType,

        prediction: isFake
            ? "Deepfake"
            : "Real",

        confidence:
            parseFloat(confidenceValue) || 0,

        date:
            new Date().toLocaleString()

    };


    history.push(analysis);


    localStorage.setItem(
        "deepfakeAnalysisHistory",
        JSON.stringify(history)
    );

}


/* =========================================================
   ANALYZE MEDIA
========================================================= */

analyzeButton.addEventListener(
    "click",
    async function () {

        if (!fileInput.files.length) {

            alert("Please select an image or video first.");

            return;
        }


        const file =
            fileInput.files[0];


        analyzeButton.disabled = true;

        analyzeButton.textContent =
            "⏳ Analyzing...";


        prediction.textContent =
            "Analyzing...";


        confidence.textContent =
            "-- %";


        prediction.className =
            "prediction";


        confidence.className =
            "confidence";


        status.textContent =
            "🤖 AI model is analyzing the media...";


        status.className =
            "status processing";


        const formData =
            new FormData();


        formData.append(
            "file",
            file
        );


        try {

            const response =
                await fetch(
                    "http://127.0.0.1:5000/predict",
                    {
                        method: "POST",
                        body: formData
                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Server returned error " +
                    response.status
                );

            }


            const data =
                await response.json();


            /* =========================================
               SUCCESS
            ========================================= */

            if (data.success) {


                prediction.textContent =
                    data.prediction;


                confidence.textContent =
                    data.confidence + " %";


                /* Save result */

                saveAnalysisResult(
                    file,
                    data.prediction,
                    data.confidence
                );


                /* REAL */

                if (
                    data.prediction
                        .toUpperCase()
                        .includes("REAL")
                ) {

                    prediction.className =
                        "prediction real";


                    status.textContent =
                        "✅ The AI model classified this media as REAL.";


                    status.className =
                        "status success";

                }


                /* DEEPFAKE */

                else {

                    prediction.className =
                        "prediction fake";


                    status.textContent =
                        "⚠️ The AI model detected possible deepfake content.";


                    status.className =
                        "status error";

                }

            }


            /* =========================================
               BACKEND ERROR
            ========================================= */

            else {

                prediction.textContent =
                    "Error";


                confidence.textContent =
                    "-- %";


                status.textContent =
                    data.error ||
                    "Unable to analyze the media.";


                status.className =
                    "status error";
            }


        }


        /* =============================================
           CONNECTION ERROR
        ============================================= */

        catch (error) {

            prediction.textContent =
                "Connection Error";


            confidence.textContent =
                "-- %";


            prediction.className =
                "prediction";


            status.textContent =
                "❌ Unable to connect to AI server. Please make sure Flask is running.";


            status.className =
                "status error";


            console.error(
                "AI Server Error:",
                error
            );

        }


        finally {

            analyzeButton.disabled =
                false;


            analyzeButton.textContent =
                "🔍  Analyze Media";

        }

    }
);