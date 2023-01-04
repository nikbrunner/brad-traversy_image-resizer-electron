const form = document.querySelector("#img-form");
const img = document.querySelector("#img");
const outputPath = document.querySelector("#output-path");
const fileName = document.querySelector("#filename");
const heightInput = document.querySelector("#height");
const widthInput = document.querySelector("#width");

function loadImage(event) {
    const file = event.target.files[0];

    if (!isImageFile(file)) {
        alertError("File is not an image.");
        return;
    } else {
        // set display block on form
        form.style.display = "block";
        fileName.innerText = file.name;
        outputPath.innerText = path.join(os.homedir(), "imageresizer");

        // get original dimensions
        const image = new Image();
        image.src = URL.createObjectURL(file);
        image.onload = function () {
            widthInput.value = String(image.width);
            heightInput.value = String(image.height);
        };
    }
}

// Send image to main process
function sendImage(event) {
    event.preventDefault();

    const width = widthInput.value;
    const height = heightInput.value;
    const imgPath = img.files[0].path;

    if (!img.files[0]) {
        alertError("Please upload an image");
        return;
    }

    if (width === "" || height === "") {
        alertError("Please fill in height and width");
        return;
    }

    // send to main using ipc-renderer
    ipcRenderer.send("image:resize", {
        imgPath,
        width,
        height
    });
}

// Catch the image:done event
ipcRenderer.on("image:done", () => {
    alertSuccess(
        `Successfully resized to ${widthInput.value}px x ${heightInput.value}px!`
    );
});

// Make sure, file is image
function isImageFile(file) {
    const acceptedImageTypes = ["image/gif", "image/png", "image/jpeg"];
    return file && acceptedImageTypes.includes(file["type"]);
}

function alertError(message) {
    Toastify.toast({
        text: message,
        duration: 5000,
        close: false,
        style: {
            background: "red",
            color: "white",
            textAlign: "Center"
        }
    });
}

function alertSuccess(message) {
    Toastify.toast({
        text: message,
        duration: 5000,
        close: false,
        style: {
            background: "green",
            color: "white",
            textAlign: "Center"
        }
    });
}

img.addEventListener("change", loadImage);
form.addEventListener("submit", sendImage);
