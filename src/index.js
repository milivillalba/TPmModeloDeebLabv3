// Obtener referencias a elementos del DOM que serán utilizados
const statusElement = document.getElementById('status-message');
const inputImageElement = document.getElementById('input-image');
const outputCanvasElement = document.getElementById('output-canvas');
const uploadImageElement = document.getElementById('upload-image');

// Crear un contenedor para la leyenda y agregar estilos
const legendContainer = document.createElement('div'); // Crear un div para la leyenda
legendContainer.style.display = 'flex'; // Mostrar los elementos de la leyenda en línea
legendContainer.style.flexDirection = 'column'; // Alinear los elementos en una columna
document.body.appendChild(legendContainer); // Agregar el contenedor de la leyenda al cuerpo del documento

let model; // Variable para almacenar el modelo cargado
let imageLoaded = false; // Estado para verificar si la imagen está cargada

// Función para actualizar el mensaje de estado
const setStatus = (message) => {
    statusElement.innerText = `Estado: ${message}`; // Actualiza el texto del elemento de estado con el mensaje proporcionado
};

// Función asíncrona para cargar el modelo de segmentación
const loadModel = async (modelName) => {
    setStatus('Cargando modelo...'); // Mostrar mensaje de estado de carga
    model = await deeplab.load({ base: modelName, quantizationBytes: 4 }); // Cargar el modelo usando la biblioteca deeplab con la configuración especificada
    setStatus('Modelo cargado.'); // Mostrar mensaje de estado de modelo cargado

    if (imageLoaded) {
        setStatus('Imagen cargada. Ejecutando segmentación...'); // Mostrar mensaje si la imagen está cargada
        runSegmentation(); // Ejecutar la segmentación si la imagen ya está cargada
    } else {
        setStatus('Modelo cargado. Por favor, sube una imagen.'); // Pedir al usuario que suba una imagen si no está cargada
    }
};

// Asignar eventos de clic a los botones para cargar diferentes modelos de segmentación
document.getElementById('model-pascal').addEventListener('click', () => loadModel('pascal'));
document.getElementById('model-cityscapes').addEventListener('click', () => loadModel('cityscapes'));
document.getElementById('model-ade20k').addEventListener('click', () => loadModel('ade20k'));

// Función para cargar y mostrar la imagen seleccionada
const loadImage = (event) => {
    const file = event.target.files[0]; // Obtener el archivo de imagen seleccionado
    if (!file.type.match('image.*')) { // Verificar si el archivo es una imagen
        setStatus('Por favor, sube una imagen válida.'); // Mostrar mensaje de error si el archivo no es una imagen
        return;
    }
    const reader = new FileReader(); // Crear un lector de archivos
    reader.onload = (e) => {
        inputImageElement.src = e.target.result; // Establecer la fuente de la imagen de entrada con el resultado de la lectura
        inputImageElement.style.display = 'block'; // Mostrar la imagen de entrada
        inputImageElement.onload = () => {
            setStatus('Imagen cargada.'); // Mostrar mensaje de imagen cargada
            imageLoaded = true; // Cambiar el estado de la imagen a cargada
            if (model) {
                setStatus('Imagen cargada. Ejecutando segmentación...');
                runSegmentation();
            }
        };
    };
    reader.readAsDataURL(file); // Leer el archivo como una URL de datos
};

// Función asíncrona para ejecutar la segmentación en la imagen cargada
const runSegmentation = async () => {
    if (!model) {
        setStatus('Por favor, selecciona un modelo primero.'); // Mostrar mensaje si no se ha cargado un modelo
        return;
    }
    setStatus('Ejecutando segmentación...'); // Mostrar mensaje de estado de ejecución

    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const imageWidth = inputImageElement.width;
        const imageHeight = inputImageElement.height;
        canvas.width = imageWidth;
        canvas.height = imageHeight;
        ctx.drawImage(inputImageElement, 0, 0);

        const imageData = ctx.getImageData(0, 0, imageWidth, imageHeight);
        const { legend, segmentationMap, height, width } = await model.segment(imageData);

        console.log('Classes:', legend);
        const imageData2 = new ImageData(new Uint8ClampedArray(segmentationMap), width, height);
        outputCanvasElement.width = width;
        outputCanvasElement.height = height;
        const ctxOutput = outputCanvasElement.getContext('2d');
        ctxOutput.putImageData(imageData2, 0, 0);

        setStatus('Segmentación completa.'); // Mostrar mensaje de segmentación completa
        displayLegend(legend); // Mostrar la leyenda de colores

    } catch (error) {
        console.error('Error en la segmentación:', error); // Imprimir error en la consola para depuración
        setStatus('Error en la segmentación. Por favor, intenta de nuevo.'); // Mostrar mensaje de error
    }
};

// Función para mostrar la leyenda de colores y etiquetas en la interfaz de usuario
const displayLegend = (legend) => {
    legendContainer.innerHTML = ''; // Limpiar la leyenda anterior
    Object.keys(legend).forEach(label => {
        const color = legend[label]; // Obtener el color de la leyenda para cada etiqueta
        const legendItem = document.createElement('div'); // Crear un contenedor para cada ítem de la leyenda
        legendItem.style.display = 'flex'; // Mostrar los ítems en línea
        legendItem.style.alignItems = 'center'; // Alinear los ítems en el centro verticalmente
        legendItem.style.marginBottom = '5px'; // Añadir un margen inferior

        const colorBox = document.createElement('div'); // Crear un cuadro de color
        colorBox.style.width = '20px'; // Establecer el ancho del cuadro de color
        colorBox.style.height = '20px'; // Establecer la altura del cuadro de color
        colorBox.style.backgroundColor = `rgb(${color.join(',')})`; // Establecer el color de fondo del cuadro
        colorBox.style.marginRight = '10px'; // Añadir un margen derecho

        const labelText = document.createElement('span'); // Crear un elemento de texto para la etiqueta
        labelText.innerText = label; // Establecer el texto de la etiqueta

        legendItem.appendChild(colorBox); // Añadir el cuadro de color al ítem de la leyenda
        legendItem.appendChild(labelText); // Añadir el texto de la etiqueta al ítem de la leyenda
        legendContainer.appendChild(legendItem); // Añadir el ítem de la leyenda al contenedor de la leyenda
    });
};

// Asignar evento al elemento de subida de imagen
uploadImageElement.addEventListener('change', loadImage); // Ejecutar la función loadImage cuando se seleccione un archivo

window.onload = () => loadModel('pascal');
