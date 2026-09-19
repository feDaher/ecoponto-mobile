import * as Location from 'expo-location';

import { PermissionDeniedError, UnavailableError, type AppError } from '@/core/errors';
import { logger } from '@/core/logger';
import { err, type Result } from '@/core/result';
import type {
  LocationGateway,
  LocationPermissionStatus,
} from '@/application/ports/location.gateway';
import { Coordinate } from '@/domain/value-objects/coordinate';

/** `expo-location` adapter for the location port. */
export class ExpoLocationGateway implements LocationGateway {
  async checkPermission(): Promise<LocationPermissionStatus> {
    const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
    return toPermissionStatus(status, canAskAgain);
  }

  async requestPermission(): Promise<LocationPermissionStatus> {
    const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
    return toPermissionStatus(status, canAskAgain);
  }

  async getCurrentPosition(): Promise<Result<Coordinate, AppError>> {
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        return err(
          new UnavailableError('Ative a localização do aparelho para ver pontos próximos.'),
        );
      }

      const permission = await this.checkPermission();
      if (permission !== 'granted') {
        return err(
          new PermissionDeniedError(
            'Precisamos da sua localização para calcular distâncias e traçar rotas.',
          ),
        );
      }

      const position = await Location.getCurrentPositionAsync({
        // `Balanced` (~100m) is enough to sort points by proximity and uses
        // much less battery than `High`.
        accuracy: Location.Accuracy.Balanced,
      });

      return Coordinate.create(position.coords.latitude, position.coords.longitude);
    } catch (cause) {
      logger.warn('Falha ao obter posição atual', { cause: String(cause) });
      return err(new UnavailableError('Não foi possível obter sua localização agora.', cause));
    }
  }
}

function toPermissionStatus(
  status: Location.PermissionStatus,
  canAskAgain: boolean,
): LocationPermissionStatus {
  if (status === 'granted') return 'granted';
  if (status === 'undetermined' || canAskAgain) return 'undetermined';
  return 'denied';
}
