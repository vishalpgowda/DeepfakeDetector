import "./style.css";

document.querySelector("#app").innerHTML = `

<header class="top-header">

    <div class="logo">
        🤖 DEEPFAKE DETECTOR
    </div>

    <a href="/dashboard.html" class="dashboard-btn">
        🏠 Dashboard
    </a>

</header>


<main class="detector">

    <div class="page-heading">

        <div class="heading-icon">
            🔍
        </div>

        <div>
            <h1>Media Analysis</h1>

            <p class="subtitle">
                Upload an image or video and let our AI model detect
                possible deepfake content.
            </p>
        </div>

    </div>


    <div class="detector-card">


        <!-- UPLOAD AREA -->

        <div class="upload-area" id="uploadArea">

            <div class="upload-icon">
                ☁️
            </div>

            <h2>Upload Media</h2>

            <p>
                Drag & drop your image or video here
            </p>

            <span class="or-text">
                or
            </span>


            <input
                type="file"
                id="fileInput"
                accept="image/*,video/*"
                hidden
            >


            <label
                for="fileInput"
                class="choose-btn"
            >
                📁 Choose Image / Video
            </label>


            <p class="supported">
                Supported: JPG, JPEG, PNG, MP4, AVI, MOV
            </p>

        </div>


        <!-- PREVIEW -->

        <div
            id="preview"
            class="preview"
        ></div>


        <!-- ANALYZE BUTTON -->

        <button
            id="analyzeButton"
            class="analyze-btn"
        >
            🔍 Analyze Media
        </button>


        <!-- RESULT -->

        <div class="result-section">

            <div class="result-box">

                <span class="result-label">
                    Prediction
                </span>

                <div
                    id="prediction"
                    class="prediction"
                >
                    --
                </div>

            </div>


            <div class="result-box">

                <span class="result-label">
                    Confidence
                </span>

                <div
                    id="confidence"
                    class="confidence"
                >
                    -- %
                </div>

            </div>

        </div>


        <!-- STATUS -->

        <div
            id="status"
            class="status"
        ></div>


    </div>

</main>
`;


const fileInput =
    document.getElementById("fileInput");

const preview =
    document.getElementById("preview");

const uploadArea =
    document.getElementById("uploadArea");

const analyzeButton =
    document.getElementById("analyzeButton");

const prediction =
    document.getElementById("prediction");

const confidence =
    document.getElementById("confidence");

const status =
    document.getElementById("status");



/* =========================================================
   FILE SELECTION
========================================================= */

fileInput.addEventListener(
    "change",
    function () {

        const file = this.files[0];

        resetResult();

        preview.innerHTML = "";

        if (!file) {
            return;
        }


        if (
            !file.type.startsWith("image/") &&
            !file.type.startsWith("video/")
        ) {

            alert(
                "Please select an image or video file."
            );

            fileInput.value = "";

            return;
        }


        showPreview(file);

    }
);



/* =========================================================
   DRAG AND DROP
========================================================= */

uploadArea.addEventListener(
    "dragover",
    function (event) {

        event.preventDefault();

        uploadArea.classList.add(
            "dragging"
        );

    }
);


uploadArea.addEventListener(
    "dragleave",
    function () {

        uploadArea.classList.remove(
            "dragging"
        );

    }
);


uploadArea.addEventListener(
    "drop",
    function (event) {

        event.preventDefault();

        uploadArea.classList.remove(
            "dragging"
        );


        const file =
            event.dataTransfer.files[0];


        if (!file) {
            return;
        }


        if (
            !file.type.startsWith("image/") &&
            !file.type.startsWith("video/")
        ) {

            alert(
                "Please drop an image or video file."
            );

            return;
        }


        fileInput.files =
            event.dataTransfer.files;


        resetResult();

        preview.innerHTML = "";

        showPreview(file);

    }
);



/* =========================================================
   SHOW PREVIEW
========================================================= */

function showPreview(file) {

    const url =
        URL.createObjectURL(file);


    if (file.type.startsWith("image/")) {

        const image =
            document.createElement("img");


        image.src = url;

        image.alt =
            "Selected media";


        preview.appendChild(image);

    }


    else if (
        file.type.startsWith("video/")
    ) {

        const video =
            document.createElement("video");


        video.src = url;

        video.controls = true;

        video.muted = true;


        preview.appendChild(video);

    }

}



/* =========================================================
   RESET RESULT
========================================================= */

function resetResult() {

    prediction.textContent = "--";

    confidence.textContent = "-- %";


    prediction.className =
        "prediction";


    confidence.className =
        "confidence";


    status.textContent = "";

    status.className =
        "status";

}



/* =========================================================
   SAVE ANALYSIS RESULT
========================================================= */

function saveAnalysisResult(
    file,
    result,
    confidenceValue
) {

    let history = [];


    try {

        history =
            JSON.parse(
                localStorage.getItem(
                    "deepfakeAnalysisHistory"
                )
            ) || [];

    }

    catch (error) {

        history = [];

    }


    const mediaType =
        file.type.startsWith("video/")
            ? "video"
            : "image";


    const isFake =
        result
            .toUpperCase()
            .includes("FAKE");


    const analysis = {

        id: Date.now(),

        fileName:
            file.name,

        mediaType:
            mediaType,

        prediction:
            isFake
                ? "Deepfake"
                : "Real",

        confidence:
            parseFloat(
                confidenceValue
            ) || 0,

        date:
            new Date()
                .toLocaleString()

    };


    history.push(
        analysis
    );


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

            alert(
                "Please select an image or video first."
            );

            return;
        }


        const file =
            fileInput.files[0];


        analyzeButton.disabled =
            true;


        analyzeButton.innerHTML =
            "⏳ Analyzing...";


        prediction.textContent =
            "Analyzing";


        confidence.textContent =
            "-- %";


        prediction.className =
            "prediction";


        confidence.className =
            "confidence";


        status.textContent =
            "🤖 AI model is analyzing your media...";


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


            if (data.success) {


                prediction.textContent =
                    data.prediction;


                confidence.textContent =
                    data.confidence + " %";


                saveAnalysisResult(
                    file,
                    data.prediction,
                    data.confidence
                );


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


                else {


                    prediction.className =
                        "prediction fake";


                    status.textContent =
                        "⚠️ The AI model detected possible deepfake content.";


                    status.className =
                        "status error";

                }

            }


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


        catch (error) {


            console.error(
                "AI Server Error:",
                error
            );


            prediction.textContent =
                "Connection Error";


            confidence.textContent =
                "-- %";


            prediction.className =
                "prediction";


            status.textContent =
                "❌ Unable to connect to AI server. Make sure api.py is running.";


            status.className =
                "status error";

        }


        finally {


            analyzeButton.disabled =
                false;


            analyzeButton.innerHTML =
                "🔍 Analyze Media";

        }

    }
);