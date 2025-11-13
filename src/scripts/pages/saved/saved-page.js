import DbHelper from '../../utils/db-helper';
import { showFormattedDate } from '../../utils';

export default class SavedPage {
  #savedStories = []; 

  async render() {
    return `
      <section class="container">
        <h2>Cerita Tersimpan</h2>
        
        <!-- Fitur Pencarian (Kriteria Skilled) -->
        <div class="search-container form-group">
          <input type="search" id="search-saved" placeholder="Cari berdasarkan nama atau deskripsi..." aria-label="Cari cerita tersimpan">
        </div>
        
        <!-- Daftar Cerita (Fitur Read & Delete) -->
        <div id="saved-story-list" class="story-list">
          <p>Memuat cerita tersimpan...</p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    await this._loadSavedStories();

    const storyListContainer = document.querySelector('#saved-story-list');
    storyListContainer.addEventListener('click', async (event) => {
      const deleteButton = event.target.closest('.delete-saved-btn');
      if (deleteButton) {
        const storyId = deleteButton.dataset.id;
        await this._deleteStory(storyId);
      }
    });

    const searchInput = document.querySelector('#search-saved');
    searchInput.addEventListener('input', (event) => {
      const query = event.target.value.toLowerCase();
      this._filterStories(query);
    });
  }

  async _loadSavedStories() {
    try {
      this.#savedStories = await DbHelper.getAllSavedStories();
      this._renderStoryList(this.#savedStories);
    } catch (error) {
      console.error(error);
      document.querySelector('#saved-story-list').innerHTML = '<p>Gagal memuat cerita tersimpan.</p>';
    }
  }

  _renderStoryList(stories) {
    const storyListContainer = document.querySelector('#saved-story-list');
    storyListContainer.innerHTML = ''; 

    if (stories.length === 0) {
      storyListContainer.innerHTML = '<p>Belum ada cerita yang Anda simpan.</p>';
      return;
    }

    stories.forEach((story) => {

      const photoUrl = story.photoBlob ? URL.createObjectURL(story.photoBlob) : story.photoUrl;
      const formattedDate = showFormattedDate(story.createdAt);

      storyListContainer.innerHTML += `
        <article class="story-item">
          <!-- Hapus foto jika tidak ingin menyimpan blob, cukup <article> -->
          <img src="${photoUrl}" alt="Cerita oleh ${story.name}">
          <div class="story-item-content">
            <p class="story-date">${formattedDate}</p>
            <h3>${story.name}</h3>
            <p>${story.description}</p>
            
            <!-- Tombol Hapus (Fitur Delete) -->
            <button class="delete-saved-btn" data-id="${story.id}" aria-label="Hapus ${story.name} dari simpanan">
              Hapus
            </button>
          </div>
        </article>
      `;
    });
  }

  _filterStories(query) {
    const filteredStories = this.#savedStories.filter((story) => {
      return story.name.toLowerCase().includes(query) ||
             story.description.toLowerCase().includes(query);
    });
    this._renderStoryList(filteredStories);
  }

  async _deleteStory(id) {
    try {
      await DbHelper.deleteSavedStory(id);
      await this._loadSavedStories(); 
    } catch (error) {
      console.error('Gagal menghapus cerita:', error);
      alert('Gagal menghapus cerita.');
    }
  }
}