import { isRunningInExpoGo } from 'expo';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { UnavailableError, type AppError } from '@/core/errors';
import { logger } from '@/core/logger';
import { err, ok, type Result } from '@/core/result';
import type {
  IncomingNotification,
  NotificationGateway,
  Unsubscribe,
} from '@/application/ports/notification.gateway';

type NotificationsModule = typeof import('expo-notifications');
type ExpoNotification = import('expo-notifications').Notification;
type ExpoNotificationResponse = import('expo-notifications').NotificationResponse;

/** Android channel; must match `defaultChannel` of the plugin in `app.config.ts`. */
const ANDROID_CHANNEL_ID = 'default';

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

function toIncoming(notification: ExpoNotification): IncomingNotification {
  const { title, body, data } = notification.request.content;
  return {
    title: title ?? null,
    body: body ?? null,
    data: data && typeof data === 'object' ? (data as Record<string, unknown>) : {},
  };
}

/** Only the tap on the notification itself; action buttons would carry other ids. */
function isDefaultTap(Notifications: NotificationsModule, response: ExpoNotificationResponse) {
  return response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER;
}

/**
 * Attaches a listener to the lazily loaded module. The returned function works
 * whether it runs before or after the module finished loading.
 */
function subscribeLazily(
  attach: (Notifications: NotificationsModule) => { remove: () => void },
): Unsubscribe {
  let subscription: { remove: () => void } | null = null;
  let cancelled = false;

  loadNotifications()
    .then((Notifications) => {
      if (!Notifications || cancelled) return;
      subscription = attach(Notifications);
    })
    .catch((cause) => logger.warn('Falha ao ouvir notificações', { cause: String(cause) }));

  return () => {
    cancelled = true;
    subscription?.remove();
    subscription = null;
  };
}

/**
 * Expo Push API adapter (section 6.6 of the specification, FE-12).
 *
 * Real Expo Go limits, documented here so they don't become a "ghost bug":
 *  - notifications (remote **and** local) don't work on Expo Go Android since
 *    SDK 53 — use a development build to test them;
 *  - emulators/simulators don't emit an Expo Push Token.
 * In those cases `registerDevice` returns `ok(null)` — a missing token is an
 * expected state, not a failure — and the listeners do nothing.
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

      // Android 13+: the channel must exist before the permission prompt can appear.
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
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
        logger.info('Sem projectId do EAS (EAS_PROJECT_ID): push remoto indisponível.');
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

  configureForegroundPresentation(): void {
    loadNotifications()
      .then((Notifications) => {
        Notifications?.setNotificationHandler({
          // Foreground: no OS banner/sound — the app shows its own toast (`onReceived`).
          // It still goes to the notification list, so it isn't lost.
          handleNotification: async () => ({
            shouldShowBanner: false,
            shouldShowList: true,
            shouldPlaySound: false,
            shouldSetBadge: false,
          }),
        });
      })
      .catch((cause) => logger.warn('Falha ao configurar notificações', { cause: String(cause) }));
  }

  onReceived(listener: (notification: IncomingNotification) => void): Unsubscribe {
    return subscribeLazily((Notifications) =>
      Notifications.addNotificationReceivedListener((notification) =>
        listener(toIncoming(notification)),
      ),
    );
  }

  onTapped(listener: (notification: IncomingNotification) => void): Unsubscribe {
    return subscribeLazily((Notifications) =>
      Notifications.addNotificationResponseReceivedListener((response) => {
        if (!isDefaultTap(Notifications, response)) return;
        // Already handled: a later `consumeLaunchNotification` must not replay it.
        Notifications.clearLastNotificationResponse();
        listener(toIncoming(response.notification));
      }),
    );
  }

  async consumeLaunchNotification(): Promise<IncomingNotification | null> {
    try {
      const Notifications = await loadNotifications();
      if (!Notifications) return null;

      const response = Notifications.getLastNotificationResponse();
      if (!response || !isDefaultTap(Notifications, response)) return null;

      Notifications.clearLastNotificationResponse();
      return toIncoming(response.notification);
    } catch (cause) {
      logger.warn('Falha ao ler a notificação de abertura', { cause: String(cause) });
      return null;
    }
  }

  onTokenRefresh(listener: () => void): Unsubscribe {
    return subscribeLazily((Notifications) => Notifications.addPushTokenListener(() => listener()));
  }
}
