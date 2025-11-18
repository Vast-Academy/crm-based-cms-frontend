import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import SummaryApi from '../common';

const registerTokenWithBackend = async (token) => {
  if (!token) return;

  await fetch(SummaryApi.registerNotificationToken.url, {
    method: SummaryApi.registerNotificationToken.method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      deviceType: 'mobile',
      platform: 'android-native',
    }),
  });
};

const removeTokenFromBackend = async (token) => {
  if (!token) return;

  await fetch(SummaryApi.removeNotificationToken.url, {
    method: SummaryApi.removeNotificationToken.method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
};

const useNativePush = () => {
  const currentTokenRef = useRef(null);

  useEffect(() => {
    console.log('[NativePush] hook mounted');

    if (!Capacitor.isNativePlatform()) {
      console.log('[NativePush] not a native platform, skipping');
      return;
    }

    const init = async () => {
      console.log('[NativePush] init started');

      try {
        const permStatus = await PushNotifications.requestPermissions();
        console.log('[NativePush] permission status', JSON.stringify(permStatus));
        if (permStatus.receive !== 'granted') {
          return;
        }

        await PushNotifications.register();

        PushNotifications.addListener('registration', async (token) => {
          console.log('[NativePush] registration token', token.value);

          currentTokenRef.current = token.value;
          try {
            await registerTokenWithBackend(token.value);
          } catch (err) {
            console.error('Failed to register native push token', err);
          }
        });

        PushNotifications.addListener('registrationError', (error) => {
          console.error('[NativePush] registration error', JSON.stringify(error));
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          // Optional: use in-app toast/alert here if desired
          console.log('Foreground push received', notification);
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          const destination = action.notification?.data?.url;
          if (!destination) return;

          if (destination.startsWith('http')) {
            window.location.href = destination;
          } else {
            const base = window.location.origin;
            window.location.href = `${base}${destination.startsWith('/') ? '' : '/'}${destination}`;
          }
        });
      } catch (error) {
        console.error('Native push init failed', error);
      }
    };

    init();

    return () => {
      console.log('[NativePush] cleanup');

      removeTokenFromBackend(currentTokenRef.current).catch((error) =>
        console.error('Failed to remove native push token', error)
      );
      currentTokenRef.current = null;
      PushNotifications.removeAllListeners();
    };
  }, []);
};

export default useNativePush;
