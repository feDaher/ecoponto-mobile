import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { UnavailableError, type AppError } from '@/core/errors';
import { logger } from '@/core/logger';
import { err, ok, type Result } from '@/core/result';
import type { NotificationGateway } from '@/application/ports/notification.gateway';

/**
 * Expo Push API adapter (section 6.6 of the specification).
 *
 * Real Expo Go limits, documented here so they don't become a "ghost bug":
 *  - **remote** push does not work on Expo Go Android since SDK 53;
 *  - emulators/simulators don't emit an Expo Push Token.
 * In those cases `registerDevice` returns `ok(null)` — a missing token is an
 * expected state, not a failure. Local notifications work everywhere.
 */
export class ExpoNotificationGateway implements NotificationGateway {
  async registerDevice(): Promise<Result<string | null, AppError>> {
    try {
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
