import 'leaflet/dist/leaflet.css';
import '../styles/styles.css';
import App from './pages/app';
import PushNotificationHelper from './utils/push-notification-helper';

document.addEventListener('DOMContentLoaded', async () => {
  await PushNotificationHelper.registerServiceWorker();

  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });
  await app.renderPage();

  window.addEventListener('hashchange', async () => {
    await app.renderPage();
  });
});