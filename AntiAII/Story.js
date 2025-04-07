// Cargar el archivo JSON con la historia
fetch('AntiAII.json')  // Cambiar el nombre del archivo para que coincida con tu JSON
    .then(response => response.json())
    .then(data => {
        startStory(data);
    })
    .catch(error => {
        console.error('Error al cargar la historia:', error);
    });

// Iniciar la historia
function startStory(storyData) {
    // Comenzamos con el primer nodo (cambiamos para adaptarnos a tu estructura JSON)
    navigateToStitch("antiAIIEsUnaRebe", storyData);
}

// Función para navegar a un stitch específico
function navigateToStitch(stitchId, storyData) {
    // Obtener el stitch actual
    const currentStitch = storyData.data.stitches[stitchId];
    
    if (!currentStitch) {
        console.error('No se encontró el stitch:', stitchId);
        return;
    }
    
    // Limpiar contenedores
    const storyTextElement = document.getElementById('story-text');
    const imageContainer = document.getElementById('image-container');
    const optionsContainer = document.getElementById('options-container');
    
    storyTextElement.innerHTML = '';
    imageContainer.innerHTML = '';
    optionsContainer.innerHTML = '';
    
    // Procesar el contenido
    currentStitch.content.forEach(item => {
        if (typeof item === 'string') {
            // Si es texto, añadirlo al contenedor de texto
            const paragraph = document.createElement('p');
            paragraph.textContent = item;
            storyTextElement.appendChild(paragraph);
        } else if (item.image) {
            // Si es una imagen, mostrarla
            displayImage(item.image);
        } else if (item.option) {
            // Si es una opción, crear un botón
            const button = document.createElement('button');
            button.textContent = item.option;
            button.onclick = () => {
                navigateToStitch(item.linkPath, storyData);
            };
            optionsContainer.appendChild(button);
        } else if (item.divert) {
            // Si es una redirección automática, navegar al siguiente stitch
            navigateToStitch(item.divert, storyData);
        }
    });
}

// Función para mostrar la imagen
function displayImage(imageUrl) {
    const imageContainer = document.getElementById('image-container');
    const imgElement = document.createElement('img');
    imgElement.src = imageUrl;
    imageContainer.appendChild(imgElement);
}