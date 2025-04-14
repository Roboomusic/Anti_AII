document.addEventListener('DOMContentLoaded', function() {
    // Elementos DOM
    const storyText = document.getElementById('story-text');
    const optionsContainer = document.getElementById('options-container');
    const sceneImage = document.getElementById('scene-image');
    const startAudioBtn = document.getElementById('start-audio-btn');
    
    // Elementos de audio
    const textBlip = document.getElementById('text-blip');
    const clickSound = document.getElementById('click-sound');
    const musicDystopia = document.getElementById('music-dystopia');
    const musicSolaris = document.getElementById('music-solaris');
    
    // Configuración de audio
    textBlip.volume = 0.3;
    clickSound.volume = 0.3;
    musicDystopia.volume = 0.4;
    musicSolaris.volume = 0.4;
    
    // Variable para controlar si el audio está habilitado
    let audioEnabled = false;
    
    // DEPURACIÓN: Verificar que los elementos de audio existen
    console.log("Elementos de audio encontrados:", {
        textBlip: !!textBlip,
        clickSound: !!clickSound,
        musicDystopia: !!musicDystopia,
        musicSolaris: !!musicSolaris
    });
    
    // NUEVA FUNCIÓN: Iniciar secuencia de audio correctamente
    function initAudio() {
        if (audioEnabled) return; // Evitar iniciar múltiples veces
        
        audioEnabled = true;
        console.log("Iniciando secuencia de audio...");
        
        // Ocultar botón de inicio
        startAudioBtn.style.display = 'none';
        
        // Iniciar primera canción
        try {
            musicDystopia.play().then(() => {
                console.log("Música Dystopia iniciada correctamente");
            }).catch(e => {
                console.error("Error al iniciar música Dystopia:", e);
            });
            
            // Cuando termine la primera canción, iniciar la segunda en loop
            musicDystopia.addEventListener('ended', function() {
                console.log("Primera canción terminada, iniciando segunda en loop");
                musicSolaris.play().catch(e => {
                    console.error("Error al iniciar música Solaris:", e);
                });
            });
            
            // Probar sonidos para asegurar que funcionan
            testSounds();
        } catch (e) {
            console.error("Error general al iniciar audio:", e);
        }
    }
    
    // Función para probar sonidos
    function testSounds() {
        try {
            // Clonar y probar el sonido de texto
            const testBlip = textBlip.cloneNode();
            testBlip.volume = 0.3;
            testBlip.play().then(() => {
                console.log("Prueba de sonido bleep exitosa");
            }).catch(e => {
                console.error("Error en prueba de sonido bleep:", e);
            });
            
            // Probar el sonido de clic
            clickSound.volume = 0.3;
            clickSound.currentTime = 0;
            clickSound.play().then(() => {
                console.log("Prueba de sonido click exitosa");
            }).catch(e => {
                console.error("Error en prueba de sonido click:", e);
            });
        } catch (e) {
            console.error("Error general en prueba de sonidos:", e);
        }
    }
    
    // Botón para iniciar audio (necesario por políticas de navegador)
    startAudioBtn.addEventListener('click', initAudio);
    
    // También iniciar con cualquier clic en la página
    document.body.addEventListener('click', function audioInit() {
        initAudio();
        document.body.removeEventListener('click', audioInit);
    }, { once: true });
    
    // Función para reproducir sonido bleep.mp3
    function playBlip() {
        if (!audioEnabled) return;
        
        try {
            // Crear un nuevo elemento de audio cada vez
            const tempBlip = new Audio('sounds/bleep.mp3');
            tempBlip.volume = 0.3;
            tempBlip.play().catch(e => {
                console.error("Error reproduciendo bleep:", e);
            });
            
            // Autolimpieza
            tempBlip.onended = function() {
                tempBlip.remove();
            };
        } catch (e) {
            console.error("Error general en playBlip:", e);
        }
    }
    
    // Función para reproducir sonido de clic
    function playClick() {
        if (!audioEnabled) return;
        
        try {
            // Crear un nuevo elemento de audio para cada clic
            const tempClick = new Audio('sounds/bleep.mp3');
            tempClick.volume = 0.3;
            tempClick.play().catch(e => {
                console.error("Error reproduciendo click:", e);
            });
            
            // Autolimpieza
            tempClick.onended = function() {
                tempClick.remove();
            };
        } catch (e) {
            console.error("Error general en playClick:", e);
        }
    }
    
    // Estado del juego
    let currentScene = 'antiAIIEsUnaRebe';  // Escena inicial
    let gameFlags = {};
    
    // Cargar datos del juego
    async function loadGameData() {
        try {
            const response = await fetch('AntiAII.json'); // Ensure this is the correct file for English
            if (!response.ok) {
                throw new Error('No se pudo cargar el archivo del juego');
            }
            return await response.json();
        } catch (error) {
            console.error('Error cargando el juego:', error);
            storyText.innerHTML = `<p>Error cargando el juego: ${error.message}</p>`;
            return null;
        }
    }
    
    // Función para actualizar imagen con efecto blur
    function updateImageWithBlur(imageUrl) {
        // Agregar efecto glitch
        sceneImage.classList.add('glitch');
        
        // Aplicar la imagen como fondo blur
        document.querySelector('.image-wrapper').style.setProperty('--bg-image', `url(${imageUrl})`);
        
        // Reemplazar imagen después de un breve retraso
        setTimeout(() => {
            sceneImage.src = imageUrl;
            
            // Quitar el efecto glitch cuando la imagen se cargue
            sceneImage.onload = () => {
                setTimeout(() => {
                    sceneImage.classList.remove('glitch');
                }, 200);
            };
        }, 200);
    }
    
    // MODIFICADO: Función para verificar si una escena es final
    function isEndScene(scene) {
        // Verifica si la escena no tiene opciones ni redirecciones
        if (!scene || !scene.content) return false;
        
        let hasOptions = false;
        let hasDivert = false;
        
        scene.content.forEach(item => {
            if (item.option && item.linkPath) hasOptions = true;
            if (item.divert) hasDivert = true;
        });
        
        return !hasOptions && !hasDivert;
    }
    
    // Función principal para cargar una escena
    async function loadScene(sceneId, markOldText = false) {
        // Si se debe marcar el texto antiguo como granate (solo cuando se hace clic en una opción)
        if (markOldText) {
            const existingParagraphs = storyText.querySelectorAll('p');
            existingParagraphs.forEach(p => {
                p.classList.add('old-text');
            });
        }
        
        // Limpiar opciones mientras se carga
        optionsContainer.innerHTML = '';
        
        // Si no tenemos datos del juego, cargarlos
        if (!window.gameData) {
            window.gameData = await loadGameData();
            if (!window.gameData) return;
        }
        
        // Obtener la escena del JSON
        const scene = window.gameData.data.stitches[sceneId];
        if (!scene) {
            console.error(`Escena "${sceneId}" no encontrada`);
            return;
        }
        
        // Actualizar estado actual
        currentScene = sceneId;
        
        // Variables para procesar el contenido
        let sceneText = '';
        let sceneOptions = [];
        let imageUrl = null;
        let nextScene = null;
        
        // Procesar el contenido de la escena
        scene.content.forEach(item => {
            if (typeof item === 'string') {
                // Texto normal
                sceneText += item + ' ';
            } else if (item.image) {
                // Imagen
                imageUrl = item.image;
            } else if (item.option && item.linkPath) {
                // Opciones
                sceneOptions.push({
                    text: item.option,
                    next: item.linkPath
                });
            } else if (item.divert) {
                // Redirección automática
                nextScene = item.divert;
            }
        });
        
        // Actualizar imagen si existe
        if (imageUrl) {
            updateImageWithBlur(imageUrl);
        }
        
        // Limpiar texto solo al reiniciar el juego
        if (sceneId === 'antiAIIEsUnaRebe') {
            storyText.innerHTML = '';
        }
        
        // Crear nuevo párrafo para texto (acumulativo)
        const paragraph = document.createElement('p');
        storyText.appendChild(paragraph);
        
        // Mostrar texto con efecto typewriter
        typewriterEffect(paragraph, sceneText, function() {
            // Hacer scroll al final del texto
            storyText.scrollTop = storyText.scrollHeight;
            
            // Mostrar opciones si hay alguna
            if (sceneOptions.length > 0) {
                showOptions(sceneOptions);
            } 
            // Si hay redirección automática, seguirla
            else if (nextScene) {
                setTimeout(() => {
                    // MODIFICACIÓN: Verificar si el destino es una escena final
                    const nextSceneData = window.gameData.data.stitches[nextScene];
                    if (isEndScene(nextSceneData)) {
                        // Si es una escena final, cargamos pero mostraremos botón de reinicio
                        loadScene(nextScene, false);
                    } else {
                        // Si no es final, seguimos el flujo normal
                        loadScene(nextScene, false);
                    }
                }, 1500);
            } 
            // Si no hay opciones ni redirección, mostrar botón de reinicio
            else {
                showRestartButton();
            }
        });
    }
    
    // Efecto de typewriter con sonido bleep.mp3
    function typewriterEffect(element, text, callback) {
        let i = 0;
        const speed = 30; // velocidad de tipeo en milisegundos
        
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                
                // Reproducir sonido bleep para cada carácter (excepto espacios)
                if (text.charAt(i) !== ' ' && text.charAt(i) !== '\n') {
                    playBlip();
                }
                
                i++;
                
                // Hacer scroll automático
                storyText.scrollTop = storyText.scrollHeight;
                
                setTimeout(type, speed);
            } else {
                if (callback) callback();
            }
        }
        
        type();
    }
    
    // Mostrar opciones con animación
    function showOptions(options) {
        optionsContainer.innerHTML = '';
        
        // Creamos los botones pero ocultos
        options.forEach((option, index) => {
            // Caso especial para el enlace de Bandcamp
            if (option.next === 'httpsroboomusicb') {
                const link = document.createElement('a');
                link.className = 'option-btn special';
                link.textContent = option.text;
                link.href = 'https://roboomusic.bandcamp.com/album/anti-aii';
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.style.opacity = '0';
                link.style.transform = 'translateX(-20px)';
                
                link.addEventListener('click', function() {
                    playClick();
                });
                
                optionsContainer.appendChild(link);
            } else {
                // Caso normal - botón de opción
                const button = document.createElement('button');
                button.className = 'option-btn';
                button.textContent = option.text;
                button.style.opacity = '0';
                button.style.transform = 'translateX(-20px)';
                
                button.addEventListener('click', function() {
                    // Reproducir sonido al hacer clic
                    playClick();
                    
                    // MODIFICACIÓN: Verificar si el destino es una escena final
                    const nextSceneData = window.gameData.data.stitches[option.next];
                    
                    // Cargar la siguiente escena y marcar texto anterior como granate
                    loadScene(option.next, true);
                });
                
                optionsContainer.appendChild(button);
            }
        });
        
        // Animamos la aparición de cada botón secuencialmente
        const allButtons = optionsContainer.querySelectorAll('.option-btn');
        animateButtonsSequentially(allButtons, 0);
    }
    
    // Función para animar los botones secuencialmente
    function animateButtonsSequentially(buttons, index) {
        if (index >= buttons.length) return;
        
        const button = buttons[index];
        
        // Reproducir sonido bleep
        playBlip();
        
        // Animar el botón actual
        setTimeout(() => {
            button.style.transition = 'opacity 0.3s, transform 0.3s';
            button.style.opacity = '1';
            button.style.transform = 'translateX(0)';
            
            // Animar el siguiente botón después de un breve retraso
            setTimeout(() => {
                animateButtonsSequentially(buttons, index + 1);
            }, 150); // Tiempo entre aparición de botones
        }, 50);
    }
    
    // Mostrar botón de reinicio cuando no hay más opciones
    function showRestartButton() {
        optionsContainer.innerHTML = '';
        
        const restartButton = document.createElement('button');
        restartButton.className = 'option-btn special';
        restartButton.textContent = 'Volver al inicio';
        restartButton.style.opacity = '0';
        restartButton.style.transform = 'translateX(-20px)';
        
        restartButton.addEventListener('click', function() {
            // Reproducir sonido al hacer clic
            playClick();
            
            // Volver a la escena inicial (sin marcar texto granate, ya que se limpia)
            loadScene('antiAIIEsUnaRebe', false);
        });
        
        optionsContainer.appendChild(restartButton);
        
        // Animar el botón de reinicio con efecto
        setTimeout(() => {
            restartButton.style.transition = 'opacity 0.3s, transform 0.3s';
            restartButton.style.opacity = '1';
            restartButton.style.transform = 'translateX(0)';
            
            // Reproducir sonido
            playBlip();
        }, 50);
    }
    
    // Comenzar el juego cargando la primera escena
    loadScene(currentScene, false);
});