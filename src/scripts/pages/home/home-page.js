import HomePresenter from "./home-presenter";

export default class HomePage {
  async render() {
    return `
      <section id="home">
        <div class="section-header">
          <h2 class="section-title">Daftar Cerita</h2>
          <button class="new-story-button">
            <i class="fas fa-plus"></i> Cerita Baru
          </button>
        </div>

        <div class="story-list__container">
          <div id="story-list" class="story-grid"></div>
          <div id="story-detail"></div>
        </div>
      </section>
    `;
  }

async afterRender() {
  const listContainer = document.querySelector("#story-list");

  const result = await HomePresenter.init();

  if (!result.success) {
    listContainer.innerHTML = `<p class="error-message">${result.message}</p>`;
    return;
  }

  listContainer.innerHTML = '';
  result.stories.forEach((story) => {
    const locationText = story.locationName || 'Lokasi tidak tersedia';

    const card = document.createElement('div');
    card.classList.add('story-card');

    card.innerHTML = `
      <img src="${story.photoUrl}" alt="${story.name}" class="story-image" />
      <div class="story-content">
        <h3 class="story-title">${story.name}</h3>
        <p class="story-date">
          <i class="fas fa-clock"></i> ${new Date(story.createdAt).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
          })} - 
          <i class="fas fa-calendar-alt"></i> ${new Date(story.createdAt).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </p>
        <p class="story-location">
          <i class="fas fa-map-marker-alt"></i> ${locationText}
        </p>
        <p class="story-description">${story.description}</p>
        <button class="btn-detail" onclick="window.location.hash = '/story-detail/${story.id}'">
          <i class="fa fa-info-circle"></i> Detail Cerita
        </button>
      </div>
    `;
    listContainer.appendChild(card);
  });

  const newStoryButton = document.querySelector('.new-story-button');
  newStoryButton.addEventListener('click', () => {
    window.location.hash = '/new-story';
  });
}

}
