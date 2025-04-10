// Variables globales existentes
let storyData;
let currentStitch = null;
let history = [];
let currentImage = null;
let typingSpeed = 5;
let clearContentOnNextStitch = false;
let typingSoundPlaying = false;
let musicStarted = false;

// Elementos de audio
const typingSound = document.getElementById('typing-sound');
const clickSound = document.getElementById('click-sound');
const backgroundMusic = document.getElementById('background-music');

// Clase para manejar efectos visuales mejorados
class TextEffectManager {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.container = null;
        this.effects = {
            glitch: {
                intensity: 0.1,
                frequency: 0.05
            },
            glow: {
                color: '#00ff00',
                blur: 10
            }
        };
    }

    init(container) {
        this.container = container;
        container.appendChild(this.canvas);
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (this.container) {
            this.canvas.width = this.container.clientWidth;
            this.canvas.height = this.container.clientHeight;
        }
    }

    drawText(text, x, y) {
        if (!this.ctx) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Efecto de brillo
        this.ctx.shadowBlur = this.effects.glow.blur;
        this.ctx.shadowColor = this.effects.glow.color;
        
        // Efecto de glitch
        if (Math.random() < this.effects.glitch.frequency) {
            const offset = Math.random() * this.effects.glitch.intensity * 20;
            this.ctx.fillText(text, x + offset, y);
        } else {
            this.ctx.fillText(text, x, y);
        }
    }
}

// Clase para manejar audio mejorado
class RetroAudioSystem {
    constructor() {
        this.typingSound = document.getElementById('typing-sound');
        this.clickSound = document.getElementById('click-sound');
        this.backgroundMusic = document.getElementById('background-music');
    }

    playSound(sound) {
        if (sound) {
            // Reiniciar el sonido si ya está reproduciendo
            sound.currentTime = 0;
            sound.play().catch(e => console.error("Error reproduciendo sonido:", e));
        }
    }

    stopSound(sound) {
        if (sound) {
            sound.pause();
            sound.currentTime = 0;
        }
    }

    playBackgroundMusic() {
        if (this.backgroundMusic && !musicStarted) {
            this.backgroundMusic.volume = 0.3; // Volumen bajo
            this.backgroundMusic.play().catch(e => {
                console.error("Error reproduciendo música:", e);
                // Intentar nuevamente tras interacción del usuario
                document.body.addEventListener('click', () => {
                    if (!musicStarted) {
                        this.backgroundMusic.play().catch(() => {});
                    }
                }, { once: true });
            });
            musicStarted = true;
        }
    }
}

// Clase para manejar transiciones
class TransitionManager {
    constructor() {
        this.transitions = {
            glitch: this.createGlitchTransition,
            fade: this.createFadeTransition,
            pixelate: this.createPixelateTransition
        };
    }

    createGlitchTransition(element, duration = 500) {
        return new Promise(resolve => {
            if (!element) {
                resolve();
                return;
            }
            
            const keyframes = [
                { transform: 'translate(0)', filter: 'none' },
                { transform: 'translate(2px, 1px)', filter: 'brightness(1.2)' },
                { transform: 'translate(-2px, -1px)', filter: 'brightness(0.8)' },
                { transform: 'translate(0)', filter: 'none' }
            ];
            
            const animation = element.animate(keyframes, {
                duration,
                iterations: 2,
                easing: 'steps(4, end)'
            });
            
            if (animation.onfinish) {
                animation.onfinish = () => resolve();
            } else {
                setTimeout(resolve, duration * 2);
            }
        });
    }

    createFadeTransition(element, duration = 300) {
        return new Promise(resolve => {
            if (!element) {
                resolve();
                return;
            }
            
            const animation = element.animate([
                { opacity: 0, transform: 'scale(0.9)' },
                { opacity: 1, transform: 'scale(1)' }
            ], {
                duration,
                easing: 'ease-out'
            });
            
            if (animation.onfinish) {
                animation.onfinish = () => resolve();
            } else {
                setTimeout(resolve, duration);
            }
        });
    }

    createPixelateTransition(element, duration = 400) {
        return new Promise(resolve => {
            if (!element) {
                resolve();
                return;
            }
            
            const keyframes = [
                { filter: 'blur(2px)' },
                { filter: 'blur(1px)' },
                { filter: 'none' }
            ];
            
            const animation = element.animate(keyframes, {
                duration,
                iterations: 1,
                easing: 'ease-out'
            });
            
            if (animation.onfinish) {
                animation.onfinish = () => resolve();
            } else {
                setTimeout(resolve, duration);
            }
        });
    }
}

// Inicialización
const textEffectManager = new TextEffectManager();
const audioSystem = new RetroAudioSystem();
const transitionManager = new TransitionManager();

// Función para procesar opciones
function processOptions(stitch, optionsDiv, currentStitchName) {
    if (!optionsDiv) return;
    optionsDiv.innerHTML = '';
    
    // Si el stitch tiene enlaces
    if (stitch && stitch.links && stitch.links.length > 0) {
        stitch.links.forEach(link => {
            const button = document.createElement('button');
            button.className = 'dialogue-option';
            button.textContent = link.text || 'Continuar';
            
            button.addEventListener('click', () => {
                // Reproducir sonido de clic
                audioSystem.playSound(clickSound);
                
                // Establecer limpieza para el próximo stitch
                clearContentOnNextStitch = true;
                
                // Navegar al stitch enlazado
                goToStitch(link.stitch);
            });
            
            optionsDiv.appendChild(button);
        });
    } else if (history.length > 0) {
        // Si no hay enlaces pero hay historial, ofrecer volver atrás
        const backButton = document.createElement('button');
        backButton.className = 'dialogue-option';
        backButton.textContent = 'Volver atrás';
        
        backButton.addEventListener('click', () => {
            audioSystem.playSound(clickSound);
            goBack();
        });
        
        optionsDiv.appendChild(backButton);
    }
    
    // Mostrar las opciones
    optionsDiv.style.visibility = 'visible';
}

// Función para volver atrás en la historia
function goBack() {
    if (history.length > 0) {
        const previousStitch = history.pop();
        currentStitch = previousStitch;
        
        const contentDiv = document.getElementById('story-content');
        const optionsDiv = document.getElementById('story-options');
        
        if (!contentDiv || !optionsDiv) return;
        
        // Limpiar contenido actual
        contentDiv.innerHTML = '';
        optionsDiv.innerHTML = '';
        
        // Procesar el stitch anterior
        let textContent = '';
        if (previousStitch && previousStitch.content) {
            previousStitch.content.forEach(item => {
                if (typeof item === 'string' && item.trim() !== '') {
                    textContent += item + ' ';
                }
                
                if (item && item.image) {
                    const imageEl = document.getElementById('story-image');
                    if (imageEl) {
                        imageEl.src = item.image;
                        currentImage = item.image;
                    }
                }
            });
        }
        
        if (textContent.trim() !== '') {
            const p = document.createElement('p');
            p.classList.add('text-with-shadow');
            contentDiv.appendChild(p);
            
            // Mostrar texto inmediatamente sin animación
            p.textContent = textContent.trim();
        }
        
        // Procesar opciones
        processOptions(previousStitch, optionsDiv, currentStitch);
    }
}

// Modificar la función typeWriter para usar los nuevos efectos
function typeWriter(element, text, callback) {
    if (!element) {
        if (callback) callback();
        return;
    }
    
    // Añadir atributo data-text para efectos de glitch en CSS
    element.setAttribute('data-text', text);
    element.classList.add('typewriter', 'typing');
    let i = 0;
    const speed = typingSpeed;
    
    // Iniciar sonido de typing
    audioSystem.playSound(typingSound);
    typingSoundPlaying = true;
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        } else {
            element.classList.remove('typing');
            // Detener sonido de typing cuando termina
            audioSystem.stopSound(typingSound);
            typingSoundPlaying = false;
            if (callback) callback();
        }
    }
    
    element.textContent = '';
    type();
}

// Modificar la función goToStitch para usar las nuevas transiciones
function goToStitch(stitchName) {
    if (!storyData || !storyData.stitches) {
        console.error("Datos de historia no cargados");
        return;
    }
    
    const stitch = storyData.stitches[stitchName];
    if (!stitch) {
        console.error("Stitch no encontrado:", stitchName);
        return;
    }

    // Guardar el stitch actual en el historial
    if (currentStitch) {
        history.push(currentStitch);
    }
    currentStitch = stitch;

    const contentDiv = document.getElementById('story-content');
    const optionsDiv = document.getElementById('story-options');
    const imageEl = document.getElementById('story-image');
    
    if (!contentDiv || !optionsDiv || !imageEl) {
        console.error("Elementos de interfaz no encontrados");
        return;
    }

    // Limpiamos las opciones siempre
    optionsDiv.innerHTML = '';
    
    // Limpiamos el contenido solo si se ha indicado
    if (clearContentOnNextStitch) {
        contentDiv.innerHTML = '';
        clearContentOnNextStitch = false;
    }
    
    // Procesar imágenes primero, solo cambia si hay una nueva imagen
    if (stitch.content) {
        stitch.content.forEach(item => {
            if (item && item.image && item.image !== currentImage) {
                // Crear nueva imagen con transición y efectos
                const newImage = new Image();
                newImage.onload = function() {
                    // Efecto de glitch en cambio de imagen
                    imageEl.style.opacity = '0';
                    
                    // Pequeño efecto de glitch en la transición
                    setTimeout(() => {
                        imageEl.style.filter = 'hue-rotate(90deg) brightness(1.2)';
                        setTimeout(() => {
                            imageEl.style.filter = 'none';
                            imageEl.src = item.image;
                            currentImage = item.image;
                            imageEl.style.opacity = '1';
                        }, 100);
                    }, 200);
                };
                newImage.src = item.image;
            }
        });
    }
    
    // Si no hay imagen definida y no hay imagen actual, usar la predeterminada
    if (!currentImage) {
        imageEl.src = 'https://f4.bcbits.com/img/a0170496156_10.jpg';
        currentImage = 'https://f4.bcbits.com/img/a0170496156_10.jpg';
        imageEl.style.display = 'block';
    }

    // Procesar el contenido de texto
    let textContent = '';
    if (stitch.content) {
        stitch.content.forEach(item => {
            if (typeof item === 'string' && item.trim() !== '') {
                textContent += item + ' ';
            }
        });
    }
    
    // Optimizar longitud del texto para móviles
    if (textContent.trim() !== '') {
        // Añadimos un separador visual entre fragmentos de texto
        if (contentDiv.children.length > 0) {
            const divider = document.createElement('div');
            divider.classList.add('text-divider');
            contentDiv.appendChild(divider);
        }
        
        const p = document.createElement('p');
        p.classList.add('text-with-shadow');
        contentDiv.appendChild(p);
        
        // Ocultar opciones hasta que termine la animación de escritura
        optionsDiv.style.visibility = 'hidden';
        
        // Iniciar el efecto de escritura con transición
        typeWriter(p, textContent.trim(), () => {
            // Cuando termine de escribir, mostrar las opciones
            processOptions(stitch, optionsDiv, stitchName);
            // Hacer scroll automático hacia el contenido nuevo
            contentDiv.scrollTop = contentDiv.scrollHeight;
        });
    } else {
        // Si no hay texto, procesar opciones inmediatamente
        processOptions(stitch, optionsDiv, stitchName);
    }
    
    // Iniciar música de fondo si no está reproduciendo
    if (!musicStarted) {
        audioSystem.playBackgroundMusic();
    }
}

// Configurar efectos de glitch
function setupGlitchEffects() {
    // Crear un efecto de parpadeo ocasional
    setInterval(() => {
        if (Math.random() > 0.9) {
            const imageEl = document.getElementById('story-image');
            if (imageEl) {
                imageEl.style.opacity = '0.7';
                setTimeout(() => {
                    imageEl.style.opacity = '1';
                }, 100);
            }
        }
    }, 5000);
    
    // Crear efectos de glitch en el monitor
    setInterval(() => {
        if (Math.random() > 0.92) {
            const imageEl = document.getElementById('story-image');
            if (imageEl) {
                imageEl.classList.add('glitch');
                setTimeout(() => {
                    imageEl.classList.remove('glitch');
                }, 200);
            }
        }
    }, 8000);
}

// Cargar datos de la historia desde AntiAII.json
async function loadStoryData() {
    try {
        // Cargar el archivo JSON desde el servidor
        const response = await fetch('AntiAII.json');
        
        // Verificar si la respuesta es correcta
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        // Convertir la respuesta a JSON
        storyData = await response.json();
        
        // Verificar que el JSON tiene el formato correcto
        if (!storyData || !storyData.stitches) {
            throw new Error("El archivo JSON no tiene el formato correcto");
        }
        
        // Determinar el stitch inicial (puede ser 'start', 'inicio' u otro valor especificado en tu JSON)
        const initialStitch = storyData.initial || 'inicio' || 'start' || Object.keys(storyData.stitches)[0];
        
        // Iniciar la historia
        goToStitch(initialStitch);
        setupGlitchEffects();
        
        // Inicializar el gestor de efectos de texto
        const contentDiv = document.getElementById('story-content');
        if (contentDiv) {
            textEffectManager.init(contentDiv);
        }
        
        console.log("Datos de historia cargados correctamente.");
        
    } catch (error) {
        console.error("Error cargando datos de la historia:", error);
        
        // Mostrar mensaje de error en la interfaz
        const contentDiv = document.getElementById('story-content');
        if (contentDiv) {
            contentDiv.innerHTML = `
                <p class="error-message">
                    Error cargando la historia. 
                    Por favor, verifica que el archivo AntiAII.json existe en el servidor 
                    y tiene el formato correcto.
                </p>
                <p class="error-details">
                    Detalles del error: ${error.message}
                </p>
            `;
        }
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Reducir volumen de los efectos de sonido
    if (typingSound) typingSound.volume = 0.2;
    if (clickSound) clickSound.volume = 0.3;
    if (backgroundMusic) backgroundMusic.volume = 0.2;
    
    // Cargar datos de la historia
    loadStoryData();
    
    // Prevenir reproducción automática hasta interacción del usuario
    document.body.addEventListener('click', () => {
        if (!musicStarted) {
            audioSystem.playBackgroundMusic();
        }
    }, { once: true });
});

// Agregar estilos al documento
const styles = `
.typewriter {
    position: relative;
    font-family: 'Courier New', monospace;
    font-size: 18px;
    line-height: 1.5;
}

.typewriter::after {
    content: '|';
    position: absolute;
    right: -10px;
    animation: blink 1s infinite;
}

@keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
}

.glitch {
    animation: glitch 0.3s ease-in-out;
}

@keyframes glitch {
    0% { transform: translate(0); }
    20% { transform: translate(-2px, 2px); }
    40% { transform: translate(-2px, -2px); }
    60% { transform: translate(2px, 2px); }
    80% { transform: translate(2px, -2px); }
    100% { transform: translate(0); }
}

.text-divider {
    height: 1px;
    background: linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent);
    margin: 20px 0;
}

.text-with-shadow {
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);