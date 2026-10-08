import * as Location from 'expo-location';
import { Platform } from 'react-native';

import type { GeocodingGateway } from '@/application/ports/geocoding.gateway';
import { PermissionDeniedError, UnavailableError, type AppError } from '@/core/errors';
import { logger } from '@/core/logger';
import { err, ok, type Result } from '@/core/result';
import { Coordinate } from '@/domain/value-objects/coordinate';

/**
 * `expo-location` adapter for geocoding (native Android/iOS geocoder, no cost).
 *
 * Platform constraints (SDK 57):
 *  - Android requires the foreground location permission before geocoding. The
 *    search was started by the user, so asking at this moment has context;
 *  - not available on the web.
 */
export class ExpoGeocodingGateway implements GeocodingGateway {
  async geocode(address: string): Promise<Result<Coordinate | null, AppError>> {
    if (Platform.OS === 'web') {
      return err(new UnavailableError('A busca por endereço está disponível só no aplicativo.'));
    }

    if (Platform.OS === 'android') {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return err(
          new PermissionDeniedError(
            'No Android, a busca por CEP ou endereço precisa do acesso à localização.',
          ),
        );
      }
    }

    try {
      const [first] = await Location.geocodeAsync(address);
      if (!first) return ok(null);

      const coordinate = Coordinate.create(first.latitude, first.longitude);
      return coordinate.ok ? coordinate : ok(null);
    } catch (cause) {
      // The native geocoder needs network on Android and throws when called too often.
      logger.warn('Falha na geocodificação', { cause: String(cause) });
      return err(
        new UnavailableError(
          'Não foi possível buscar este endereço agora. Tente novamente.',
          cause,
        ),
      );
    }
  }
}
