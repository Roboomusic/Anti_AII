let storyData;
let currentSection = null;

fetch('AntiAII.json')
  .then(response => response.json())
  .then(data => {
    storyData = data;
    startStory();
  });

function startStory() {
  document.getElementById('story-title').textContent = storyData.title;
  goToSection("AntiAIIInspirado");
}

function goToSection(title) {
  const section = storyData.sections.find(sec => sec.title === title || sec.link === title);
  if (!section) {
    showEnd();
    return;
  }

  currentSection = section;

  const contentDiv = document.getElementById('story-content');
  const optionsDiv = document.getElementById('story-options');
  const image = document.getElementById('story-image');

  contentDiv.innerHTML = '';
  optionsDiv.innerHTML = '';

  if (section.image) {
    image.src = section.image;
    image.style.display = 'block';
  } else {
    image.style.display = 'none';
  }

  section.content.forEach(content => {
    const p = document.createElement('p');
    p.textContent = content.text;
    contentDiv.appendChild(p);

    if (content.options) {
      content.options.forEach(option => {
        const btn = document.createElement('button');
        btn.textContent = option.text;
        btn.addEventListener('click', () => goToSection(option.link));
        optionsDiv.appendChild(btn);
      });
    }
  });

  // Si es una sección tipo menú (como la inicial)
  if (section.type === "menu" && section.options) {
    section.options.forEach(option => {
      const p = document.createElement('p');
      p.textContent = option.text;
      contentDiv.appendChild(p);
      option.links.forEach(link => {
        const btn = document.createElement('button');
        btn.textContent = link.text;
        btn.addEventListener('click', () => goToSection(link.link));
        optionsDiv.appendChild(btn);
      });
    });
  }
}

function showEnd() {
  const contentDiv = document.getElementById('story-content');
  const optionsDiv = document.getElementById('story-options');
  contentDiv.innerHTML = '<p>Gracias por jugar. ¡La resistencia te necesita más que nunca!</p>';
  optionsDiv.innerHTML = '';
}
