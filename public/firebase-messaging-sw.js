/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const DB_NAME = 'syncvap-firebase-config';
const STORE_NAME = 'config';
const CONFIG_KEY = 'firebase';

const openConfigDb = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = (event) => reject(event.target.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });

const saveConfig = async (config) => {
  const db = await openConfigDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(config, CONFIG_KEY);
    request.onsuccess = resolve;
    request.onerror = (event) => reject(event.target.error);
  });
};

const getStoredConfig = async () => {
  const db = await openConfigDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(CONFIG_KEY);
    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

let messagingInstance = null;

const ensureMessaging = async (config) => {
  if (messagingInstance) {
    return messagingInstance;
  }

  if (!config) {
    return null;
  }

  if (!firebase.apps.length) {
    firebase.initializeApp(config);
  }

  messagingInstance = firebase.messaging();

  messagingInstance.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification?.title || 'Notification';
    const notificationOptions = {
      body: payload.notification?.body,
      data: {
        ...payload.data,
        url: payload.data?.url || '/dashboard',
      },
      icon: '/logo192.png',
      badge: '/logo192.png',
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });

  return messagingInstance;
};

getStoredConfig()
  .then((config) => ensureMessaging(config))
  .catch((error) => {
    console.error('Failed to load Firebase config from IndexedDB', error);
  });

self.addEventListener('message', (event) => {
  if (event.data?.type === 'INIT_FIREBASE' && event.data.config) {
    saveConfig(event.data.config).catch((error) =>
      console.error('Failed to store Firebase config', error)
    );
    ensureMessaging(event.data.config).catch((error) =>
      console.error('Failed to initialize Firebase messaging', error)
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const destination = event.notification?.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const matchingClient = clientList.find((client) => client.url.includes(self.location.origin));
      if (matchingClient) {
        matchingClient.focus();
        matchingClient.postMessage({
          type: 'NAVIGATE',
          url: destination,
          data: event.notification?.data,
        });
        return;
      }

      clients.openWindow(destination);
    })
  );
});
