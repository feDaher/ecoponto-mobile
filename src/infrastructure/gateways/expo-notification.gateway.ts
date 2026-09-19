import { isRunningInExpoGo } from 'expo';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { UnavailableError, type AppError } from '@/core/errors';
import { logger } from '@/core/logger';
import { err, ok, type Result } from '@/core/result';
import type { NotificationGateway } from '@/application/ports/notification.gateway';

type NotificationsModule = typeof import('expo-notifications');

/**
 * `expo-notifications` registers a push token listener as an import side
 * effect, and on Expo Go Android (SDK 53+) that listener **throws**. So the
 * module is loaded lazily and never on Expo Go Android — a static import would
 * crash the whole app on startup.
 */
const isSupported = !(isRunningInExpoGo() && Platform.OS === 'android');

let notificationsModule: Promise<NotificationsModule> | null = null;

function loadNotifications(): Promise<NotificationsModule | null> {
  if (!isSupported) return Promise.resolve(null);
  notificationsModule ??= import('expo-notifications');
  return notificationsModule;
}

/**
 * Expo Push API adapter (section 6.6 of the specification).
 *
 * Real Expo Go limits, documented here so they don't become a "ghost bug":
 *  - notifications (remote **and** local) don't work on Expo Go Android since
 *    SDK 53 — use a development build to test them;
 *  - emulators/simulators don't emit an Expo Push Token.
 * In those cases `registerDevice` returns `ok(null)` — a missing token is an
 * expected state, not a failure.
 */
export class ExpoNotificationGateway implements NotificationGateway {
  async registerDevice(): Promise<Result<string | null, AppError>> {
    try {
      const Notifications = await loadNotifications();
      if (!Notifications) {
        logger.info('Notificações indisponíveis no Expo Go Android: use um development build.');
        return ok(null);
      }

      if (!Device.isDevice) {
        logger.info('Push indisponível: execução em emulador.');
        return ok(null);
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Avisos do EcoPonto',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }

      const current = await Notifications.getPermissionsAsync();
      const status = current.granted ? current : await Notifications.requestPermissionsAsync();

      if (!status.granted) {
        logger.info('Usuário não autorizou notificações.');
        return ok(null);
      }

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

      if (!projectId) {
        logger.info('Sem projectId do EAS: push remoto exige development build.');
        return ok(null);
      }

      const token = await Notifications.getExpoPushTokenAsync({ projectId });
      return ok(token.data);
    } catch (cause) {
      // Expo Go Android lands here — we carry on without push instead of breaking the app.
      logger.warn('Push remoto indisponível neste ambiente', { cause: String(cause) });
      return ok(null);
    }
  }

  async scheduleLocal(params: {
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }): Promise<Result<void, AppError>> {
    try {
      const Notifications = await loadNotifications();
      if (!Notifications) {
        return err(new UnavailableError('Notificações indisponíveis neste ambiente.'));
      }

      await Notifications.scheduleNotificationAsync({
        content: { title: params.title, body: params.body, data: params.data ?? {} },
        trigger: null, // immediate
      });
      return ok();
    } catch (cause) {
      logger.warn('Falha ao agendar notificação local', { cause: String(cause) });
      return err(new UnavailableError('Não foi possível exibir a notificação.', cause));
    }
  }
}
