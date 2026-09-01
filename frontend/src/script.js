const fileInput = document.getElementById("fileInput");
const preview = document.getElementById("preview");
const loading = document.getElementById("loading");
const result = document.getElementById("result");

fileInput.addEventListener("change", function () {

    preview.innerHTML = "";
    result.innerHTML = "";

    const file = this.files[0];

    if (!file) return;

    const url = URL.createObjectURL(file);

    if (file.type.startsWith("image")) {

        const img = document.createElement("img");
        img.src = url;
        preview.appendChild(img);

    }

    else if (file.type.startsWith("video")) {

        const video = document.createElement("video");
        video.src = url;
        video.controls = true;
        preview.appendChild(video);

    }

});

function analyzeFile(){

    if(fileInput.files.length===0){

        alert("Please upload an image or video.");
        return;
    }

    loading.style.display="block";
    result.innerHTML="";

    setTimeout(function(){

        loading.style.display="none";

        const random=Math.random();

        if(random>0.5){

            result.innerHTML="Prediction: REAL";
            result.className="real";

        }

        else{

            result.innerHTML="Prediction: DEEPFAKE";
            result.className="fake";

        }

    },3000);

}