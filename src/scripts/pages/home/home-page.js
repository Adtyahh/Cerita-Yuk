import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getAllStories } from '../../data/api';
import { getAuthToken, showFormattedDate } from '../../utils';
import DbHelper from '../../utils/db-helper'; 

export default class HomePage {
  #map = null;
  #markers = [];
  #stories = []; 

  async render() {
    return `
      <section class="container">
        <h2>Lokasi Cerita</h2>
        <div id="map" class="map-container"></div>
        
        <h2>Daftar Cerita</h2>
        <div id="story-list" class="story-list">
          <p>Memuat cerita...</p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    if (!getAuthToken()) {
      window.location.hash = '#/login';
      return;
    }

    this.#map = L.map('map').setView([-2.5489, 118.0149], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    const storyListContainer = document.querySelector('#story-list');

    await this._setupStories(storyListContainer);
    this._setupClickListeners(storyListContainer);
  }

  async _setupStories(storyListContainer) {
    this.#markers = [];
    this.#stories = []; 
    storyListContainer.innerHTML = ''; 

    const customIcon = L.icon({
      iconUrl: 'iconppl.png',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    try {
      const response = await getAllStories();
      this.#stories = response.listStory; 

      if (this.#stories.length === 0) {
        storyListContainer.innerHTML = '<p>Belum ada cerita untuk ditampilkan.</p>';
        return;
      }

      let storyCardsHtml = '';
      for (const [index, story] of this.#stories.entries()) {
        const formattedDate = showFormattedDate(story.createdAt);
        
        const isSaved = await DbHelper.getSavedStoryById(story.id);

        storyCardsHtml += `
          <article class="story-item" data-index="${index}">
            <img src="${story.photoUrl}" alt="Cerita oleh ${story.name}">
            <div class="story-item-content">
              <p class="story-date">${formattedDate}</p>
              <h3>${story.name}</h3>
              <p>${story.description.substring(0, 100)}...</p>
              
              <button 
                class="save-story-btn" 
                data-id="${story.id}" 
                data-index="${index}" 
                aria-label="Simpan ${story.name} untuk dilihat offline"
                ${isSaved ? 'disabled' : ''}>
                ${isSaved ? 'Tersimpan' : 'Simpan Cerita'} 
              </button>
            </div>
          </article>
        `;

        if (story.lat && story.lon) {
          
          const popupContent = `
            <div class="map-popup">
              <img src="${story.photoUrl}" alt="${story.name}">
              <b>${story.name}</b>
              <p>${story.description.substring(0, 50)}...</p>
            </div>
          `;

          const marker = L.marker([story.lat, story.lon], { icon: customIcon })
            .addTo(this.#map)
            .bindPopup(popupContent);
          
          this.#markers[index] = marker; 
        }
      }
      storyListContainer.innerHTML = storyCardsHtml; 

    } catch (error) {
      console.error(error);
      storyListContainer.innerHTML = `<p>Error: ${error.message}</p>`;
      if (error.message.includes('token')) {
        window.location.hash = '#/login';
      }
    }
  }

  _setupClickListeners(storyListContainer) {
    storyListContainer.addEventListener('click', (event) => {
      const saveButton = event.target.closest('.save-story-btn');
      const storyItem = event.target.closest('.story-item');

      if (saveButton) {
        event.stopPropagation(); 
        const index = saveButton.dataset.index;
        this._saveStoryForOffline(this.#stories[index], saveButton);
      } else if (storyItem) {
        const index = storyItem.dataset.index;
        if (index === undefined) return;
        
        const marker = this.#markers[index];
        if (marker) {
          const latLng = marker.getLatLng();
          this.#map.flyTo(latLng, 8); 
          marker.openPopup();
        }
      }
    });
  }

  async _saveStoryForOffline(story, button) {
    if (!story) return;

    button.textContent = 'Menyimpan...';
    button.disabled = true;

    try {
      const response = await fetch(story.photoUrl);
      const blob = await response.blob();

      const storyToSave = {
        ...story,
        photoBlob: blob, 
      };

      await DbHelper.addSavedStory(storyToSave);

      button.textContent = 'Tersimpan';
      alert('Cerita berhasil disimpan!');

    } catch (error) {
      console.error('Gagal menyimpan cerita:', error);
      alert('Gagal menyimpan cerita.');
      button.textContent = 'Simpan Cerita'; 
      button.disabled = false;
    }
  }
}