document.addEventListener("DOMContentLoaded", function () {
    // DOM Elements
    const startAudioBtn = document.getElementById("start-audio-btn");
    const spanishBtn = document.getElementById("es-btn");
    const englishBtn = document.getElementById("en-btn");
    const mainContainer = document.querySelector(".main-container");
    const gameFrame = document.getElementById("gameFrame");

    // Audio Elements
    const musicDystopia = document.getElementById("music-dystopia");
    const musicSolaris = document.getElementById("music-solaris");
    const clickSound = document.getElementById("click-sound");

    // Global state variable
    window.audioEnabled = false;

    // Set volumes
    if (musicDystopia) musicDystopia.volume = 0.4;
    if (musicSolaris) musicSolaris.volume = 0.4;
    if (clickSound) clickSound.volume = 0.3;

    // Setup music sequence
    function setupMusicSequence() {
        if (!musicDystopia || !musicSolaris) return;

        musicDystopia.addEventListener('ended', () => {
            musicSolaris.currentTime = 0;
            musicSolaris.play().catch(console.error);
        });

        musicSolaris.addEventListener('ended', () => {
            musicDystopia.currentTime = 0;
            musicDystopia.play().catch(console.error);
        });
    }

    // Initialize audio
    function initAudio() {
        if (window.audioEnabled) return;
        
        window.audioEnabled = true;
        console.log("Audio initialized...");

        if (startAudioBtn) startAudioBtn.style.display = "none";

        setupMusicSequence();
        if (musicDystopia) {
            musicDystopia.play().catch(console.error);
        }
    }

    // Play click sound
    function playClick() {
        if (!window.audioEnabled || !clickSound) return;
        clickSound.currentTime = 0;
        clickSound.play().catch(() => {});
    }

    // Initialize audio on any click
    document.body.addEventListener("click", function initOnClick() {
        initAudio();
        document.body.removeEventListener("click", initOnClick);
    }, { once: true });

    // Start audio button
    if (startAudioBtn) {
        startAudioBtn.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            initAudio();
        });
    }

    // Language buttons
    if (spanishBtn) {
        spanishBtn.addEventListener("click", function() {
            initAudio();
            playClick();
            mainContainer.style.display = 'none';
            gameFrame.style.display = 'block';
            gameFrame.src = 'game-es.html';
            console.log("Loading Spanish game...");
        });
    }

    if (englishBtn) {
        englishBtn.addEventListener("click", function() {
            initAudio();
            playClick();
            mainContainer.style.display = 'none';
            gameFrame.style.display = 'block';
            gameFrame.src = 'game-en.html';
            console.log("Loading English game...");
        });
    }

    // Title animation
    function animateTitle() {
        const title = document.querySelector(".main-title");
        if (!title) return;
        
        title.style.opacity = "0";
        title.style.transform = "translateY(-20px)";

        setTimeout(() => {
            title.style.transition = "opacity 1.5s ease, transform 1.5s ease";
            title.style.opacity = "1";
            title.style.transform = "translateY(0)";
        }, 500);
    }

    // Staggered animation effect
    function addStaggeredAnimation() {
        const elements = [
            document.querySelector(".main-title"),
            document.querySelector(".subtitle"),
            document.querySelector(".language-selector"),
            document.querySelector(".footer"),
        ];

        elements.forEach((el, index) => {
            if (el) {
                el.style.opacity = "0";
                el.style.transform = "translateY(20px)";
                el.style.transition = `opacity 1s ease ${index * 0.2}s, transform 1s ease ${index * 0.2}s`;

                setTimeout(() => {
                    el.style.opacity = "1";
                    el.style.transform = "translateY(0)";
                }, 100);
            }
        });
    }

    // Apply animations
    setTimeout(addStaggeredAnimation, 500);
    animateTitle();

    // Background movement effect
    document.addEventListener("mousemove", function(e) {
        const xPos = e.clientX / window.innerWidth - 0.5;
        const yPos = e.clientY / window.innerHeight - 0.5;
        document.body.style.backgroundPosition = `${xPos * 10}px ${yPos * 10}px`;
    });
});