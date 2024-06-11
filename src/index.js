const statusElement = document.getElementById('status-message');
const inputImageElement = document.getElementById('input-image');
const outputCanvasElement = document.getElementById('output-canvas');
const uploadImageElement = document.getElementById('upload-image');

let model;

const setStatus = (message) => {
    statusElement.innerText = `Status: ${message}`;
};

const loadModel = async (modelName) => {
    setStatus('Loading model...');
    model = await deeplab.load({ base: modelName, quantizationBytes: 2 });
    setStatus('Model loaded. Please upload an image.');
};

document.getElementById('model-pascal').addEventListener('click', () => loadModel('pascal'));
document.getElementById('model-cityscapes').addEventListener('click', () => loadModel('cityscapes'));
document.getElementById('model-ade20k').addEventListener('click', () => loadModel('ade20k'));

const loadImage = (event) => {
    const file = event.target.files[0];
    if (!file.type.match('image.*')) {
        setStatus('Please upload a valid image.');
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        inputImageElement.src = e.target.result;
        inputImageElement.style.display = 'block';
        inputImageElement.onload = () => {
            setStatus('Image loaded. Running segmentation...');
            runSegmentation();
        };
    };
    reader.readAsDataURL(file);
};

const runSegmentation = async () => {
    if (!model) {
        setStatus('Please select a model first.');
        return;
    }
    setStatus('Running segmentation...');
    
    const segmentation = await model.segment(inputImageElement);
    
    const { legend, height, width, segmentationMap } = segmentation;
    const canvasContext = outputCanvasElement.getContext('2d');
    outputCanvasElement.width = width;
    outputCanvasElement.height = height;
    
    const imageData = new ImageData(width, height);
    for (let i = 0; i < segmentationMap.length; i++) {
        const offset = i * 4;
        const label = segmentationMap[i];
        const color = legend[label];
        if (!color) {
            imageData.data[offset] = 0;
            imageData.data[offset + 1] = 0;
            imageData.data[offset + 2] = 0;
            imageData.data[offset + 3] = 255;
        } else {
            imageData.data[offset] = color[0];
            imageData.data[offset + 1] = color[1];
            imageData.data[offset + 2] = color[2];
            imageData.data[offset + 3] = 255;
        }
    }
    canvasContext.putImageData(imageData, 0, 0);
    setStatus('Segmentation complete.');
};

uploadImageElement.addEventListener('change', loadImage);
