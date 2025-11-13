import CONFIG from '../config';

const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const PushNotificationHelper = {
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
    return null;
  },

  async requestPermission() {
    if ('Notification' in window) {
      try {
        const result = await Notification.requestPermission();
        if (result === 'denied') {
          console.log('Notification permission denied');
          return false;
        }
        if (result === 'default') {
          console.log('Notification permission dismissed');
          return false;
        }
        return true;
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
      }
    }
    return false;
  },

  async getSubscription() {
    const registration = await navigator.serviceWorker.ready;
    return registration.pushManager.getSubscription();
  },

  async subscribePush() {
    const registration = await navigator.serviceWorker.ready;
    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      console.log('Subscribed to push notification:', subscription);
      
      await this.sendSubscriptionToServer(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notification:', error);
      return null;
    }
  },

  async unsubscribePush() {
    const subscription = await this.getSubscription();
    if (subscription) {
      try {
        await this.sendUnsubscriptionToServer(subscription);
        await subscription.unsubscribe();
        console.log('Unsubscribed from push notification');
        return true;
      } catch (error) {
        console.error('Failed to unsubscribe:', error);
        return false;
      }
    }
    return false;
  },
  
  async sendSubscriptionToServer(subscription) {
    const token = sessionStorage.getItem('AUTH_TOKEN'); 
    if (!token) return;

    await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(subscription.toJSON()),
    });
  },

  async sendUnsubscriptionToServer(subscription) {
    const token = sessionStorage.getItem('AUTH_TOKEN');
    if (!token) return;

    await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
  },
};

export default PushNotificationHelper;