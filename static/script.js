let video = document.getElementById('video');
let canvas = document.getElementById('canvas');
let context = canvas.getContext('2d');
let model;
let unit = 'cm';

document.getElementById('start-button').addEventListener('click', startMeasurement);
document.getElementById('switch-camera-button').addEventListener('click', switchToRearCamera);
document.getElementById('unit-select').addEventListener('change', (e) => {
    unit = e.target.value;
});

async function startMeasurement() {
    // Acceder a la cámara
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const constraints = {
            video: true
        };
        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject = stream;
            video.play();
            video.onloadedmetadata = () => {
                // Cargar el modelo de TensorFlow.js
                loadModel();
            };
        } catch (error) {
            console.error("Error al acceder a la cámara: ", error);
        }
    }
}

async function switchToRearCamera() {
    // Acceder a la cámara trasera
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const constraints = {
            video: {
                facingMode: { exact: "environment" }
            }
        };
        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject = stream;
            video.play();
        } catch (error) {
            console.error("Error al acceder a la cámara trasera: ", error);
            alert("No se puede acceder a la cámara trasera. Por favor, asegúrese de que su dispositivo tenga una cámara trasera disponible.");
        }
    }
}

async function loadModel() {
    model = await cocoSsd.load();
    detectFrame();
}

async function detectFrame() {
    const predictions = await model.detect(video);
    drawPredictions(predictions);
    requestAnimationFrame(detectFrame);
}

function drawPredictions(predictions) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    predictions.forEach(prediction => {
        context.beginPath();
        context.rect(...prediction.bbox);
        context.lineWidth = 2;
        context.strokeStyle = 'red';
        context.fillStyle = 'red';
        context.stroke();
        context.fillText(`${prediction.class} - ${prediction.score.toFixed(2)}`, prediction.bbox[0], prediction.bbox[1] > 10 ? prediction.bbox[1] - 5 : 10);

        // Dibujar flechas y mostrar medidas
        drawArrow(context, prediction.bbox[0], prediction.bbox[1], prediction.bbox[0] + prediction.bbox[2], prediction.bbox[1], 'X');
        drawArrow(context, prediction.bbox[0], prediction.bbox[1], prediction.bbox[0], prediction.bbox[1] + prediction.bbox[3], 'Y');
    });
}

function drawArrow(ctx, fromx, fromy, tox, toy, axis) {
    const headlen = 10; // length of head in pixels
    const dx = tox - fromx;
    const dy = toy - fromy;
    const angle = Math.atan2(dy, dx);

    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Mostrar medidas
    const distance = Math.sqrt(dx * dx + dy * dy);
    ctx.fillText(`${distance.toFixed(2)} ${unit}`, (fromx + tox) / 2, (fromy + toy) / 2);
}

document.getElementById('capture-button').addEventListener('click', () => {
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'medicion.png';
    link.click();
});

document.getElementById('export-button').addEventListener('click', () => {
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'medicion.png';
    link.click();
});