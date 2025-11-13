import routes from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';
import { getAuthToken, clearAuthToken } from '../utils';
import PushNotificationHelper from '../utils/push-notification-helper'; 
import DbHelper from '../utils/db-helper'; 
import { addNewStory } from '../data/api'; 

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;
  #navLogin = null;
  #navLogout = null;
  #notifToggle = null; 
  #loadingOverlay = null; 

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this.#navLogin = document.querySelector('#nav-login');
    this.#navLogout = document.querySelector('#nav-logout');
    this.#notifToggle = document.querySelector('#notif-toggle'); 
    this.#loadingOverlay = document.querySelector('#loading-overlay'); 

    this._setupDrawer();
    this._setupLogoutButton();
    this._updateNavVisibility();
    
    this._initNotifToggle(); 
    
    window.addEventListener('online', () => DbHelper.syncOutbox(addNewStory));
    DbHelper.syncOutbox(addNewStory);
  }

  _setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      this.#navigationDrawer.classList.toggle('open');
    });

    document.body.addEventListener('click', (event) => {
      if (!this.#navigationDrawer.contains(event.target) && !this.#drawerButton.contains(event.target)) {
        this.#navigationDrawer.classList.remove('open');
      }

      this.#navigationDrawer.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove('open');
        }
      })
    });
  }

  _setupLogoutButton() {
    if (this.#navLogout) {
      const logoutLink = this.#navLogout.querySelector('a');
      
      logoutLink.addEventListener('click', async (event) => {
        event.preventDefault(); 
        
        this.#loadingOverlay.style.display = 'flex';
        
        clearAuthToken();
        this._updateNavVisibility();
        
        try {
          await PushNotificationHelper.unsubscribePush();
        } catch (error) {
          console.error('Gagal unsubscribe saat logout:', error);
        }
        
        window.location.hash = '#/login';
      });
    }
  }

  async _initNotifToggle() {
    if (!('Notification' in window) || !('PushManager' in window)) {
      this.#notifToggle.style.display = 'none';
      return;
    }

    const subscription = await PushNotificationHelper.getSubscription();
    if (subscription) {
      this.#notifToggle.classList.add('active');
    }

    this.#notifToggle.addEventListener('click', async () => {
      if (this.#notifToggle.classList.contains('active')) {
        await PushNotificationHelper.unsubscribePush();
        this.#notifToggle.classList.remove('active');
      } else {
        const permissionGranted = await PushNotificationHelper.requestPermission();
        if (permissionGranted) {
          await PushNotificationHelper.subscribePush();
          this.#notifToggle.classList.add('active');
        }
      }
    });
  }

  _updateNavVisibility() {
    const isLoggedIn = getAuthToken();
    
    if (this.#navLogin && this.#navLogout) {
      if (isLoggedIn) {
        this.#navLogin.style.display = 'none';
        this.#navLogout.style.display = 'block';
        this.#notifToggle.style.display = 'block'; 
      } else {
        this.#navLogin.style.display = 'block';
        this.#navLogout.style.display = 'none';
        this.#notifToggle.style.display = 'none'; 
      }
    }
  }

  async renderPage() {
    this._updateNavVisibility();
    
    const url = getActiveRoute();
    const page = routes[url];

    const hideLoading = async () => {
      this.#content.innerHTML = await page.render();
      await page.afterRender();
      this.#loadingOverlay.style.display = 'none';
    };

    if (!document.startViewTransition) {
      await hideLoading();
      return;
    }

    document.startViewTransition(hideLoading);
  }
}

export default App;