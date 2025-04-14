// Detectar si estamos en un iframe (como en itch.io)
function isInIframe() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true; // Si hay un error de seguridad, asumimos iframe
  }
}

// Función para ajustar el tamaño del juego
function adjustGameSize() {
  // Marcar si estamos en un iframe
  if (isInIframe()) {
    document.body.classList.add('in-iframe');
  }
  
  const gameContainer = document.getElementById('game-container') || document.body;
  
  // Si estamos en fullscreen en itch.io, asegurarnos que no exceda la pantalla
  if (document.fullscreenElement || document.webkitFullscreenElement) {
    gameContainer.style.width = '100vw';
    gameContainer.style.height = '100vh';
    gameContainer.style.maxWidth = '100vw';
    gameContainer.style.maxHeight = '100vh';
  }
}

// Inicializar y configurar eventos
window.addEventListener('load', function() {
  adjustGameSize();
  
  // Escuchar cambios de tamaño
  window.addEventListener('resize', adjustGameSize);
  
  // Escuchar cambios de fullscreen
  document.addEventListener('fullscreenchange', adjustGameSize);
  document.addEventListener('webkitfullscreenchange', adjustGameSize);
  
  // Escuchar mensajes de itch.io
  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'fullscreen') {
      setTimeout(adjustGameSize, 100);
    }
  });
});
document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const storyText = document.getElementById("story-text");
  const optionsContainer = document.getElementById("options-container");
  const sceneImage = document.getElementById("scene-image");

  // Sound Effects
  const textBlip = document.getElementById("text-blip");
  const clickSound = document.getElementById("click-sound");

  if (textBlip) textBlip.volume = 0.4;
  if (clickSound) clickSound.volume = 0.5;

  // Global audio state from main-page.js
  let audioEnabled = window.audioEnabled || false;
  console.log("Audio state in game.js:", audioEnabled);

  // Utility function for playing sounds
  function playSound(elementId, fallbackSrc) {
    if (!audioEnabled) return;

    try {
      const soundElement = document.getElementById(elementId);
      if (soundElement) {
        soundElement.currentTime = 0;
        soundElement.play().catch((e) => {
          console.error(`Error playing ${elementId}:`, e);
          const tempSound = new Audio(fallbackSrc);
          tempSound.volume = 0.3;
          tempSound.play().catch(console.error);
        });
      } else {
        console.error(`Audio element '${elementId}' not found`);
      }
    } catch (e) {
      console.error(`General error in playSound for ${elementId}:`, e);
    }
  }

  function playBlip() {
    playSound("text-blip", "sounds/bleep.mp3");
  }

  function playClick() {
    playSound("click-sound", "sounds/bleep.mp3");
  }

  // Game state
  let currentScene = "antiAIIEsUnaRebe"; // Default initial scene
  let sceneId = currentScene; // Define sceneId to avoid reference errors

  // Load game data
  async function loadGameData() {
    try {
      let jsonFile = "AntiAII.json"; // Default Spanish

      const currentPath = window.location.pathname;
      if (
        currentPath.includes("game-en.html") &&
        sceneId === "antiAIIEsUnaRebe"
      ) {
        jsonFile = "AntiAIIen.json";
        console.log("English version detected, loading:", jsonFile);
      } else {
        console.log("Spanish version detected, loading:", jsonFile);
      }

      storyText.innerHTML = "<p>Loading story...</p>";

      const response = await fetch(jsonFile);

      if (!response.ok) {
        throw new Error(
          `Failed to load game file ${jsonFile} (status: ${response.status})`
        );
      }

      const data = await response.json();
      console.log("JSON loaded successfully:", Object.keys(data));

      if (!data.data || !data.data.stitches) {
        throw new Error(
          `The JSON file ${jsonFile} does not have the correct structure`
        );
      }

      console.log(
        "First available scenes:",
        Object.keys(data.data.stitches).slice(0, 3)
      );
      return data;
    } catch (error) {
      console.error("Error loading game:", error);
      storyText.innerHTML = `<p>Error loading game: ${error.message}</p>
                          <p>Ensure the file ${jsonFile} is in the same folder and correctly formatted</p>`;
      return null;
    }
  }

  // Update image with blur effect
  function updateImageWithBlur(imageUrl) {
    sceneImage.classList.add("glitch");

    document
      .querySelector(".image-wrapper")
      .style.setProperty("--bg-image", `url(${imageUrl})`);

    requestAnimationFrame(() => {
      sceneImage.src = imageUrl;

      sceneImage.onload = () => {
        requestAnimationFrame(() => {
          sceneImage.classList.remove("glitch");
        });
      };
    });
  }

  // Check if a scene is an end scene
  function isEndScene(scene) {
    if (!scene || !scene.content) return false;

    let hasOptions = false;
    let hasDivert = false;

    scene.content.forEach((item) => {
      if (item.option && item.linkPath) hasOptions = true;
      if (item.divert) hasDivert = true;
    });

    return !hasOptions && !hasDivert;
  }

  // Main function to load a scene
  async function loadScene(sceneId, markOldText = false) {
    if (markOldText) {
      const existingParagraphs = storyText.querySelectorAll("p");
      existingParagraphs.forEach((p) => {
        p.classList.add("old-text");
      });
    }

    optionsContainer.innerHTML = "";

    if (!window.gameData) {
      window.gameData = await loadGameData();
      if (!window.gameData) return;

      const scenes = Object.keys(window.gameData.data.stitches);
      if (scenes.length > 0) {
        console.log("Adjusting initial scene in English to:", scenes[0]);
        sceneId = scenes[0];
        currentScene = sceneId;
      }
    }

    const scene = window.gameData.data.stitches[sceneId];
    if (!scene) {
      console.error(`Scene "${sceneId}" not found`);
      storyText.innerHTML += `<p>Error: Scene "${sceneId}" not found</p>`;
      return;
    }

    currentScene = sceneId;

    let sceneText = "";
    let sceneOptions = [];
    let imageUrl = null;
    let nextScene = null;

    scene.content.forEach((item) => {
      if (typeof item === "string") {
        sceneText += item + " ";
      } else if (item.image) {
        imageUrl = item.image;
      } else if (item.option && item.linkPath) {
        sceneOptions.push({
          text: item.option,
          next: item.linkPath,
        });
      } else if (item.divert) {
        nextScene = item.divert;
      }
    });

    if (imageUrl) {
      updateImageWithBlur(imageUrl);
    }

    if (sceneId === "antiAIIEsUnaRebe") {
      storyText.innerHTML = "";
    }

    const paragraph = document.createElement("p");
    storyText.appendChild(paragraph);

    typewriterEffect(paragraph, sceneText, function () {
      storyText.scrollTop = storyText.scrollHeight;

      if (sceneOptions.length > 0) {
        showOptions(sceneOptions);
      } else if (nextScene) {
        setTimeout(() => {
          const nextSceneData = window.gameData.data.stitches[nextScene];
          if (isEndScene(nextSceneData)) {
            loadScene(nextScene, false);
          } else {
            loadScene(nextScene, false);
          }
        }, 1500);
      } else {
        showRestartButton();
      }
    });
  }

  // Typewriter effect with sound
  function typewriterEffect(element, text, callback) {
    let i = 0;
    const speed = 30;

    function type() {
      if (i < text.length) {
        element.textContent += text.charAt(i);

        if (text.charAt(i) !== " " && text.charAt(i) !== "\n") {
          playBlip();
        }

        i++;

        storyText.scrollTop = storyText.scrollHeight;

        setTimeout(type, speed);
      } else {
        if (callback) callback();
      }
    }

    type();
  }

  function forceScrollToBottom() {
    if (storyText) {
      storyText.scrollTop = storyText.scrollHeight;

      requestAnimationFrame(() => {
        storyText.scrollTop = storyText.scrollHeight;
      });
    }
  }

  function showOptions(options) {
    optionsContainer.innerHTML = "";

    options.forEach((option, index) => {
      if (option.next === "httpsroboomusicb") {
        const link = document.createElement("a");
        link.className = "option-btn special";
        link.textContent = option.text;
        link.href = "https://roboomusic.bandcamp.com/album/anti-aii";
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.style.opacity = "0";
        link.style.transform = "translateX(-20px)";

        link.addEventListener("click", function () {
          playClick();
        });

        optionsContainer.appendChild(link);
      } else {
        const button = document.createElement("button");
        button.className = "option-btn";
        button.textContent = option.text;
        button.style.opacity = "0";
        button.style.transform = "translateX(-20px)";

        button.addEventListener("click", function () {
          playClick();
          loadScene(option.next, true);
        });

        optionsContainer.appendChild(button);
      }
    });

    forceScrollToBottom();

    const allButtons = optionsContainer.querySelectorAll(".option-btn");
    animateButtonsSequentially(allButtons, 0);
  }

  function animateButtonsSequentially(buttons, index) {
    if (index >= buttons.length) return;

    const button = buttons[index];
    playBlip();

    setTimeout(() => {
      button.style.transition = "opacity 0.3s, transform 0.3s";
      button.style.opacity = "1";
      button.style.transform = "translateX(0)";

      forceScrollToBottom();

      animateButtonsSequentially(buttons, index + 1);
    }, 200);
  }

  function showRestartButton() {
    optionsContainer.innerHTML = "";

    const restartButton = document.createElement("button");
    restartButton.className = "option-btn special";
    restartButton.textContent = "Volver al inicio";
    restartButton.style.opacity = "0";
    restartButton.style.transform = "translateX(-20px)";

    restartButton.addEventListener("click", function () {
      playClick();
      loadScene("antiAIIEsUnaRebe", false);
    });

    optionsContainer.appendChild(restartButton);

    forceScrollToBottom();

    setTimeout(() => {
      restartButton.style.transition = "opacity 0.3s, transform 0.3s";
      restartButton.style.opacity = "1";
      restartButton.style.transform = "translateX(0)";
      playBlip();
    }, 50);
  }

  loadScene(currentScene, false);
});
