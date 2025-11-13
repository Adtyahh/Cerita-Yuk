import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { addNewStory } from '../../data/api';
import { getAuthToken } from '../../utils';
import DbHelper from '../../utils/db-helper'; 

export default class AddStoryPage {
  #map = null;
  #marker = null;

  async render() {
    return `
      <section class="container">
        <div class="form-container">
          <h2>Tambah Cerita Baru</h2>
          <form id="add-story-form">
            <div id="error-message" class="error-message"></div>
            
            <div class="form-group">
              <label for="description">Deskripsi</label>
              <textarea id="description" name="description" required></textarea>
            </div>
            
            <div class="form-group">
              <label for="photo">Upload Gambar</label>
              <input type="file" id="photo" name="photo" accept="image/*" required>
            </div>
            
            <div class="form-group">
              <label>Pilih Lokasi (Klik di Peta)</label>
              <div id="map-picker" class="map-container"></div>
              <input type="hidden" id="lat" name="lat">
              <input type="hidden" id="lon" name="lon">
            </div>
            
            <button type="submit" class="form-button" id="submit-button">Submit Cerita</button>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    if (!getAuthToken()) {
      window.location.hash = '#/login';
      return;
    }

    const customIcon = L.icon({
      iconUrl: 'iconppl.png', 
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    this.#map = L.map('map-picker').setView([-2.5489, 118.0149], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      document.querySelector('#lat').value = lat;
      document.querySelector('#lon').value = lng;

      if (this.#marker) {
        this.#map.removeLayer(this.#marker);
      }

      this.#marker = L.marker([lat, lng], { icon: customIcon }).addTo(this.#map);
    });

    const addStoryForm = document.querySelector('#add-story-form');
    addStoryForm.addEventListener('submit', (event) => {
      event.preventDefault();
      this._handleFormSubmit();
    });
  }

  async _handleFormSubmit() {
    const form = document.querySelector('#add-story-form');
    const errorMessage = document.querySelector('#error-message');
    const submitButton = document.querySelector('#submit-button');

    errorMessage.textContent = '';
    submitButton.disabled = true;
    submitButton.textContent = 'Mengirim...';

    const description = form.description.value;
    const photo = form.photo.files[0];
    const lat = form.lat.value;
    const lon = form.lon.value;

    if (!description || !photo || !lat || !lon) {
      errorMessage.textContent = 'Semua field (deskripsi, foto, dan lokasi peta) wajib diisi.';
      submitButton.disabled = false;
      submitButton.textContent = 'Submit Cerita';
      return;
    }

    const storyData = {
      id: new Date().toISOString(), 
      description,
      photo, 
      lat,
      lon,
    };

    const formData = new FormData();
    formData.append('description', description);
    formData.append('photo', photo);
    formData.append('lat', parseFloat(lat));
    formData.append('lon', parseFloat(lon));

    try {
      await addNewStory(formData);
      alert('Cerita baru berhasil ditambahkan!');
      window.location.hash = '#/';
    } catch (error) {
      console.error('Gagal mengirim ke API, menyimpan ke Outbox...', error);
      try {
        await DbHelper.addStoryToOutbox(storyData);
        alert('Gagal terkirim. Cerita disimpan di Outbox dan akan diunggah saat kembali online.');
        window.location.hash = '#/';
      } catch (dbError) {
        console.error('Gagal menyimpan ke Outbox:', dbError);
        errorMessage.textContent = `Error: ${error.message}. Gagal menyimpan ke Outbox.`;
        submitButton.disabled = false;
        submitButton.textContent = 'Submit Cerita';
      }
    }
  }
}