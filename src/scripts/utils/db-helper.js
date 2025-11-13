const DB_NAME = 'cerita-yuk-db';
const DB_VERSION = 2;
const OUTBOX_STORE_NAME = 'outbox';
const SAVED_STORIES_STORE_NAME = 'saved-stories'; 

const openDb = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(OUTBOX_STORE_NAME)) {
        db.createObjectStore(OUTBOX_STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(SAVED_STORIES_STORE_NAME)) {
        db.createObjectStore(SAVED_STORIES_STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

async function performDbOperation(storeName, mode, operation) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    tx.oncomplete = () => resolve(true); 
    tx.onerror = (event) => reject(event.target.error);

    const store = tx.objectStore(storeName);
    const request = operation(store);
    
    if (mode === 'readonly') {
      request.onsuccess = () => {
        tx.oncomplete = () => resolve(request.result);
      };
    }
  });
}

const DbHelper = {
  addStoryToOutbox(storyData) {
    return performDbOperation(OUTBOX_STORE_NAME, 'readwrite', (store) => store.add(storyData));
  },
  getAllStoriesFromOutbox() {
    return performDbOperation(OUTBOX_STORE_NAME, 'readonly', (store) => store.getAll());
  },
  deleteStoryFromOutbox(id) {
    return performDbOperation(OUTBOX_STORE_NAME, 'readwrite', (store) => store.delete(id));
  },
  syncOutbox: async (apiCallback) => {
    console.log('Syncing outbox...');
    const stories = await DbHelper.getAllStoriesFromOutbox();
    if (stories.length === 0) {
      console.log('Outbox is empty.');
      return;
    }
    for (const story of stories) {
      try {
        const formData = new FormData();
        formData.append('id', story.id);
        formData.append('description', story.description);
        formData.append('photo', story.photo);
        formData.append('lat', story.lat);
        formData.append('lon', story.lon);
        await apiCallback(formData);
        await DbHelper.deleteStoryFromOutbox(story.id);
        console.log(`Story ${story.id} synced successfully.`);
      } catch (error) {
        console.error(`Failed to sync story ${story.id}:`, error);
      }
    }
  },

  addSavedStory(story) {
    return performDbOperation(SAVED_STORIES_STORE_NAME, 'readwrite', (store) => store.add(story));
  },
  getAllSavedStories() {
    return performDbOperation(SAVED_STORIES_STORE_NAME, 'readonly', (store) => store.getAll());
  },
  deleteSavedStory(id) {
    return performDbOperation(SAVED_STORIES_STORE_NAME, 'readwrite', (store) => store.delete(id));
  },
  getSavedStoryById(id) {
    return performDbOperation(SAVED_STORIES_STORE_NAME, 'readonly', (store) => store.get(id));
  },
};

export default DbHelper;