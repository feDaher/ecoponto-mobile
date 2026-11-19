import { router } from 'expo-router';
import { useEffect } from 'react';

import type { IncomingNotification } from '@/application/ports/notification.gateway';
import { logger } from '@/core/logger';
import { useToastStore } from '@/presentation/components/ui/toast';
import { useContainer, useUseCases } from '@/presentation/providers/container-provider';
import { useSessionStatus } from '@/presentation/stores/session.store';

import { resolveNotificationRoute } from './notification-route';

function openRelatedScreen(notification: IncomingNotification) {
  router.push(resolveNotificationRoute(notification.data));
}

/**
 * Push notifications wiring (FE-12). Mount once, in the root layout.
 *
 *  - tap with the app in background → `onTapped` opens the related screen;
 *  - tap that launched the app from closed → `consumeLaunchNotification` on boot;
 *  - arrival with the app open → in-app toast (tapping it opens the screen);
 *  - signed in → asks for permission and registers the token for the user.
 *
 * Background/closed *display* is done by the OS — nothing runs in JS for it.
 */
export function usePushNotifications(): void {
  const { gateways } = useContainer();
  const { registerPushToken } = useUseCases();
  const status = useSessionStatus();
  const notifications = gateways.notification;

  useEffect(() => {
    notifications.configureForegroundPresentation();

    let active = true;
    notifications.consumeLaunchNotification().then((launch) => {
      if (active && launch) openRelatedScreen(launch);
    });

    const stopTapped = notifications.onTapped(openRelatedScreen);
    const stopReceived = notifications.onReceived((notification) => {
      const message = notification.body ?? notification.title;
      if (!message) return;

      useToastStore.getState().show({
        type: 'info',
        title: notification.body ? (notification.title ?? undefined) : undefined,
        message,
        onPress: () => openRelatedScreen(notification),
      });
    });

    return () => {
      active = false;
      stopTapped();
      stopReceived();
    };
  }, [notifications]);

  useEffect(() => {
    // Only signed-in users: the token belongs to an account, and guests are not
    // asked for a permission they gain nothing from.
    if (status !== 'authenticated') return;

    const register = async () => {
      const result = await registerPushToken.execute();
      if (!result.ok) {
        logger.warn('Falha ao registrar push token', { code: result.error.code });
      } else if (result.value) {
        // Dev only (info is dropped in production): copy it to send a test push.
        logger.info('Push token pronto', { token: result.value });
      }
    };

    register();
    return notifications.onTokenRefresh(register);
  }, [status, notifications, registerPushToken]);
}
