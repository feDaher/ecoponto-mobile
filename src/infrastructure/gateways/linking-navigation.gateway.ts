import * as Linking from 'expo-linking';

import { UnavailableError, type AppError } from '@/core/errors';
import { logger } from '@/core/logger';
import { err, ok, type Result } from '@/core/result';
import type {
  ExternalNavigationGateway,
  RouteRequest,
  WhatsAppRequest,
} from '@/application/ports/external-navigation.gateway';

/**
 * Exits to external apps via deep link.
 *
 * We chose the universal `https` URLs (Google Maps Directions API and wa.me)
 * over the native schemes (`comgooglemaps://`, `whatsapp://`) because they:
 *  - work on Android, iOS and web with the same code (RB11 requires both);
 *  - open the installed app automatically and fall back to the browser when
 *    it doesn't exist, instead of failing;
 *  - don't need `canOpenURL`, which on Android 11+ requires declaring `queries`
 *    in the manifest — impossible to adjust inside Expo Go.
 */
export class LinkingNavigationGateway implements ExternalNavigationGateway {
  /** RB11 — opens the route in Google Maps from the current location. */
  async openRoute(request: RouteRequest): Promise<Result<void, AppError>> {
    const { destination, origin } = request;

    const params = new URLSearchParams({
      api: '1',
      destination: `${destination.latitude},${destination.longitude}`,
      travelmode: 'driving',
    });

    // Without an explicit origin, Google Maps uses the device's current position.
    if (origin) params.append('origin', `${origin.latitude},${origin.longitude}`);

    return this.openUrl(`https://www.google.com/maps/dir/?${params.toString()}`);
  }

  /** RB08 — direct contact with the person responsible for the point. */
  async openWhatsApp(request: WhatsAppRequest): Promise<Result<void, AppError>> {
    const phone = request.phone.replace(/\D/g, '');
    const text = request.message ? `?text=${encodeURIComponent(request.message)}` : '';

    return this.openUrl(`https://wa.me/${phone}${text}`);
  }

  async openUrl(url: string): Promise<Result<void, AppError>> {
    try {
      await Linking.openURL(url);
      return ok();
    } catch (cause) {
      logger.warn('Falha ao abrir link externo', { cause: String(cause) });
      return err(new UnavailableError('Não foi possível abrir o aplicativo externo.', cause));
    }
  }
}
