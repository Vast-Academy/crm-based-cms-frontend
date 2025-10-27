import { useCallback, useEffect, useRef, useState } from 'react';
import {
  deleteToken,
  getToken,
  onMessage,
} from 'firebase/messaging';
import SummaryApi from '../common';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { getFirebaseConfig, getMessagingInstance } from '../firebase';

const getDeviceType = () => {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad/.test(ua)) return 'mobile';
  return 'desktop';
};

const usePushNotifications = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const tokenRef = useRef(null);
  const messagingRef = useRef(null);

  const removeTokenFromBackend = useCallback(
    async (token) => {
      if (!token) return;
      try {
        await fetch(SummaryApi.removeNotificationToken.url, {
          method: SummaryApi.removeNotificationToken.method,
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
      } catch (error) {
        console.error('Failed to remove notification token', error);
      }
    },
    []
  );

  const sendConfigToServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return null;
    const registration =
      (await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')) ||
      (await navigator.serviceWorker.register('/firebase-messaging-sw.js'));

    await navigator.serviceWorker.ready;

    const worker =
      registration?.installing ||
      registration?.waiting ||
      registration?.active;

    if (worker) {
      worker.postMessage({
        type: 'INIT_FIREBASE',
        config: getFirebaseConfig(),
      });
    }

    return registration;
  }, []);

  const registerToken = useCallback(async () => {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') {
      console.warn('Notifications API not available in this environment.');
      return;
    }
    if (!user) return;

    const messaging = await getMessagingInstance();
    if (!messaging) {
      console.warn('Push messaging is not supported in this browser.');
      return;
    }

    messagingRef.current = messaging;

    if (Notification.permission === 'default') {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      if (permissionResult !== 'granted') {
        return;
      }
    }

    if (Notification.permission === 'denied') {
      setPermission('denied');
      return;
    }

    const registration = await sendConfigToServiceWorker();
    if (!registration) return;

    const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.error('Missing REACT_APP_FIREBASE_VAPID_KEY');
      return;
    }

    try {
      const currentToken = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (!currentToken || currentToken === tokenRef.current) {
        return;
      }

      await fetch(SummaryApi.registerNotificationToken.url, {
        method: SummaryApi.registerNotificationToken.method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: currentToken,
          deviceType: getDeviceType(),
          platform: navigator.userAgent,
        }),
      });

      tokenRef.current = currentToken;
    } catch (error) {
      console.error('Failed to register FCM token', error);
    }
  }, [sendConfigToServiceWorker, user]);

  const cleanupToken = useCallback(async () => {
    const existingToken = tokenRef.current;
    if (!existingToken) return;

    await removeTokenFromBackend(existingToken);

    try {
      if (messagingRef.current) {
        await deleteToken(messagingRef.current);
      }
    } catch (error) {
      console.error('Failed to delete FCM token', error);
    }

    tokenRef.current = null;
  }, [removeTokenFromBackend]);

  useEffect(() => {
    if (!user || !['technician', 'manager'].includes(user.role)) {
      cleanupToken();
      return;
    }

    registerToken();
  }, [cleanupToken, registerToken, user]);

  useEffect(() => {
    let unsubscribe;
    (async () => {
      const messaging = await getMessagingInstance();
      if (!messaging) return;

      unsubscribe = onMessage(messaging, (payload) => {
        const title =
          payload.notification?.title ||
          payload.data?.title ||
          'Notification';
        const body =
          payload.notification?.body ||
          payload.data?.body ||
          '';
        const iconPath =
          payload.notification?.icon ||
          payload.data?.icon ||
          '/logo192.png';
        const icon = iconPath.startsWith('http')
          ? iconPath
          : `${window.location.origin}${iconPath.startsWith('/') ? '' : '/'}${iconPath}`;

        const message = [title, body].filter(Boolean).join(' - ');
        if (message) {
          showNotification('info', message);
        }

        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          try {
            const desktopNotification = new Notification(title, {
              body,
              icon,
              tag: payload.data?.tag || payload.data?.orderId,
              data: payload.data,
            });

            desktopNotification.onclick = () => {
              window.focus();
              const destination = payload.data?.url;
              if (destination) {
                if (destination.startsWith('http')) {
                  window.location.href = destination;
                } else {
                  window.location.href = `${window.location.origin}${destination.startsWith('/') ? '' : '/'}${destination}`;
                }
              }
              desktopNotification.close();
            };
          } catch (error) {
            console.error('Foreground notification failed', error);
          }
        }
      });
    })();

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [showNotification]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        registerToken();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [registerToken]);

  return { permission };
};

export default usePushNotifications;
