// Variables globales existentes
let storyData;
let currentStitch = null;
let history = [];
let currentImage = null;
let typingSpeed = 5;
let clearContentOnNextStitch = false;
let typingSoundPlaying = false;
let musicStarted = false;

// Clase para manejar efectos visuales mejorados
class TextEffectManager {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
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
        container.appendChild(this.canvas);
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
    }

    drawText(text, x, y) {
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
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        
        // Efectos de audio
        this.effects = {
            chorus: this.createChorusEffect(),
            phaser: this.createPhaserEffect(),
            compressor: this.createCompressor()
        };
        
        // Configuración inicial
        this.masterGain.gain.value = 0.7;
    }

    createChorusEffect() {
        const chorus = this.audioContext.createChorus();
        chorus.frequency.value = 1.5;
        chorus.delayTime.value = 2;
        chorus.depth.value = 0.2;
        chorus.type = 'triangle';
        return chorus;
    }

    createPhaserEffect() {
        const phaser = this.audioContext.createPhaser();
        phaser.frequency.value = 1000;
        phaser.octaves = 3;
        phaser.baseFrequency = 1000;
        return phaser;
    }

    createCompressor() {
        const compressor = this.audioContext.createDynamicsCompressor();
        compressor.threshold.value = -50;
        compressor.ratio.value = 12;
        compressor.attack.value = 0;
        compressor.release.value = 0.25;
        return compressor;
    }

    async loadSound(url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            return audioBuffer;
        } catch (error) {
            console.error('Error al cargar el sonido:', error);
            return null;
        }
    }

    playSound(audioBuffer) {
        try {
            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            
            // Conexión de efectos
            source.connect(this.effects.compressor);
            this.effects.compressor.connect(this.effects.chorus);
            this.effects.chorus.connect(this.effects.phaser);
            this.effects.phaser.connect(this.masterGain);
            
            source.start(0);
        } catch (error) {
            console.error('Error al reproducir el sonido:', error);
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
            const keyframes = [
                { transform: 'translate(0)', filter: 'none' },
                { transform: 'translate(2px, 1px)', filter: 'brightness(1.2)' },
                { transform: 'translate(-2px, -1px)', filter: 'brightness(0.8)' },
                { transform: 'translate(0)', filter: 'none' }
            ];
            
            element.animate(keyframes, {
                duration,
                iterations: 2,
                easing: 'steps(4, end)'
            }).onfinish = () => resolve();
        });
    }

    createFadeTransition(element, duration = 300) {
        return new Promise(resolve => {
            element.animate([
                { opacity: 0, transform: 'scale(0.9)' },
                { opacity: 1, transform: 'scale(1)' }
            ], {
                duration,
                easing: 'ease-out'
            }).onfinish = () => resolve();
        });
    }

    createPixelateTransition(element, duration = 400) {
        return new Promise(resolve => {
            const keyframes = [
                { filter: 'blur(2px)' },
                { filter: 'blur(1px)' },
                { filter: 'none' }
            ];
            
            element.animate(keyframes, {
                duration,
                iterations: 1,
                easing: 'ease-out'
            }).onfinish = () => resolve();
        });
    }
}

// Inicialización
const textEffectManager = new TextEffectManager();
const audioSystem = new RetroAudioSystem();
const transitionManager = new TransitionManager();

// Modificar la función typeWriter para usar los nuevos efectos
function typeWriter(element, text, callback) {
    // Añadir atributo data-text para efectos de glitch en CSS
    element.setAttribute('data-text', text);
    element.classList.add('typewriter', 'typing');
    let i = 0;
    const speed = typingSpeed;
    
    // Iniciar sonido de typing con efectos retro
    audioSystem.playSound(typingSound);
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        } else {
            element.classList.remove('typing');
            // Detener sonido de typing cuando termina
            audioSystem.stopSound(typingSound);
            if (callback) callback();
        }
    }
    
    element.textContent = '';
    type();
}

// Modificar la función goToStitch para usar las nuevas transiciones
function goToStitch(stitchName) {
    const stitch = storyData.stitches[stitchName];
    if (!stitch) {
        console.error("Stitch not found:", stitchName);
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

    // Limpiamos las opciones siempre
    optionsDiv.innerHTML = '';
    
    // Limpiamos el contenido solo si se ha indicado
    if (clearContentOnNextStitch) {
        contentDiv.innerHTML = '';
        clearContentOnNextStitch = false;
    }
    
    // Procesar imágenes primero, solo cambia si hay una nueva imagen
    stitch.content.forEach(item => {
        if (item.image && item.image !== currentImage) {
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
    
    // Si no hay imagen definida y no hay imagen actual, usar la predeterminada
    if (!currentImage) {
        imageEl.src = 'https://f4.bcbits.com/img/a0170496156_10.jpg';
        currentImage = 'https://f4.bcbits.com/img/a0170496156_10.jpg';
        imageEl.style.display = 'block';
    }

    // Procesar el contenido de texto
    let textContent = '';
    stitch.content.forEach(item => {
        if (typeof item === 'string' && item.trim() !== '') {
            textContent += item + ' ';
        }
    });
    
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
}

// Modificar la función setupGlitchEffects para usar las nuevas transiciones
function setupGlitchEffects() {
    // Crear un efecto de parpadeo ocasional
    setInterval(() => {
        if (Math.random() > 0.9) {
            const imageEl = document.getElementById('story-image');
            imageEl.style.opacity = '0.7';
            setTimeout(() => {
                imageEl.style.opacity = '1';
            }, 100);
        }
    }, 5000);
    
    // Crear efectos de glitch en el monitor
    setInterval(() => {
        if (Math.random() > 0.92) {
            const imageEl = document.getElementById('story-image');
            imageEl.classList.add('glitch');
            setTimeout(() => {
                imageEl.classList.remove('glitch');
            }, 200);
        }
    }, 8000);
}

// Agregar CSS para los efectos visuales
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

// Agregar estilos al documento
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);
