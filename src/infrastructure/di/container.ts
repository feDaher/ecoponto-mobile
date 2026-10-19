import type { AuthGateway } from '@/application/ports/auth.gateway';
import type { ExternalNavigationGateway } from '@/application/ports/external-navigation.gateway';
import type { GeocodingGateway } from '@/application/ports/geocoding.gateway';
import type { LocationGateway } from '@/application/ports/location.gateway';
import type { NotificationGateway } from '@/application/ports/notification.gateway';
import type { PlacesGateway } from '@/application/ports/places.gateway';
import { AuthenticateUserUseCase } from '@/application/use-cases/authenticate-user.use-case';
import { ContactPointWhatsAppUseCase } from '@/application/use-cases/contact-point-whatsapp.use-case';
import { GeocodeAddressUseCase } from '@/application/use-cases/geocode-address.use-case';
import { GetPointDetailsUseCase } from '@/application/use-cases/get-point-details.use-case';
import { GetRankingUseCase } from '@/application/use-cases/get-ranking.use-case';
import { ListEducationalContentUseCase } from '@/application/use-cases/list-educational-content.use-case';
import { ListMyDisposalsUseCase } from '@/application/use-cases/list-my-disposals.use-case';
import { ListNearbyPointsUseCase } from '@/application/use-cases/list-nearby-points.use-case';
import { PlotRouteUseCase } from '@/application/use-cases/plot-route.use-case';
import { RegisterCollectionPointUseCase } from '@/application/use-cases/register-collection-point.use-case';
import { RegisterDisposalUseCase } from '@/application/use-cases/register-disposal.use-case';
import { RegisterUserUseCase } from '@/application/use-cases/register-user.use-case';
import { ResolvePlaceUseCase } from '@/application/use-cases/resolve-place.use-case';
import { ReviewPointUseCase } from '@/application/use-cases/review-point.use-case';
import {
  EndSessionUseCase,
  RestoreSessionUseCase,
} from '@/application/use-cases/session.use-cases';
import { SuggestPlacesUseCase } from '@/application/use-cases/suggest-places.use-case';
import { env } from '@/core/env';
import { logger } from '@/core/logger';
import type { CollectionPointRepository } from '@/domain/repositories/collection-point.repository';
import type { DisposalRepository } from '@/domain/repositories/disposal.repository';
import type { EducationalContentRepository } from '@/domain/repositories/educational-content.repository';
import type { ReviewRepository } from '@/domain/repositories/review.repository';

import { FirebaseAuthGateway } from '../auth/firebase-auth.gateway';
import { InMemoryAuthGateway } from '../auth/in-memory-auth.gateway';
import { ExpoGeocodingGateway } from '../gateways/expo-geocoding.gateway';
import { ExpoLocationGateway } from '../gateways/expo-location.gateway';
import { ExpoNotificationGateway } from '../gateways/expo-notification.gateway';
import { HttpPlacesGateway } from '../gateways/http-places.gateway';
import { InMemoryPlacesGateway } from '../gateways/in-memory-places.gateway';
import { LinkingNavigationGateway } from '../gateways/linking-navigation.gateway';
import { HttpClient } from '../http/http-client';
import { HttpCollectionPointRepository } from '../repositories/http/http-collection-point.repository';
import { HttpDisposalRepository } from '../repositories/http/http-disposal.repository';
import { HttpEducationalContentRepository } from '../repositories/http/http-educational-content.repository';
import { HttpReviewRepository } from '../repositories/http/http-review.repository';
import { InMemoryCollectionPointRepository } from '../repositories/in-memory/in-memory-collection-point.repository';
import { InMemoryDisposalRepository } from '../repositories/in-memory/in-memory-disposal.repository';
import { InMemoryEducationalContentRepository } from '../repositories/in-memory/in-memory-educational-content.repository';
import { InMemoryReviewRepository } from '../repositories/in-memory/in-memory-review.repository';

/**
 * Composition root — the **only** place in the app that decides concrete
 * implementations. No screen, hook or use case imports `Http*` or `InMemory*`.
 *
 * Switching the data source:
 *   without `EXPO_PUBLIC_API_URL` → in-memory repositories (Manhuaçu seed);
 *   with `EXPO_PUBLIC_API_URL`    → HTTP repositories against the REST API.
 *
 * This keeps the app running on Expo Go from day one and makes the switch to
 * the backend an environment variable, not a refactor.
 */
export type Container = {
  readonly useCases: {
    readonly listNearbyPoints: ListNearbyPointsUseCase;
    readonly getPointDetails: GetPointDetailsUseCase;
    readonly registerCollectionPoint: RegisterCollectionPointUseCase;
    readonly registerDisposal: RegisterDisposalUseCase;
    readonly listMyDisposals: ListMyDisposalsUseCase;
    readonly reviewPoint: ReviewPointUseCase;
    readonly plotRoute: PlotRouteUseCase;
    readonly contactWhatsApp: ContactPointWhatsAppUseCase;
    readonly authenticateUser: AuthenticateUserUseCase;
    readonly registerUser: RegisterUserUseCase;
    readonly restoreSession: RestoreSessionUseCase;
    readonly endSession: EndSessionUseCase;
    readonly getRanking: GetRankingUseCase;
    readonly listEducationalContent: ListEducationalContentUseCase;
    readonly suggestPlaces: SuggestPlacesUseCase;
    readonly resolvePlace: ResolvePlaceUseCase;
    readonly geocodeAddress: GeocodeAddressUseCase;
  };
  readonly gateways: {
    readonly location: LocationGateway;
    readonly navigation: ExternalNavigationGateway;
    readonly notification: NotificationGateway;
    readonly auth: AuthGateway;
    readonly places: PlacesGateway;
    readonly geocoding: GeocodingGateway;
  };
  readonly info: {
    readonly dataSource: typeof env.dataSource;
    readonly authProvider: typeof env.authProvider;
  };
};

export function createContainer(): Container {
  // The HTTP client needs the token, which comes from the auth gateway — which,
  // in the Firebase case, needs the HTTP client. The late reference breaks the cycle.
  let authRef: AuthGateway | null = null;

  const http = new HttpClient(env.apiUrl ?? '', env.apiTimeoutMs, async () =>
    authRef ? authRef.getToken() : null,
  );

  const useApi = env.dataSource === 'http';

  const points: CollectionPointRepository = useApi
    ? new HttpCollectionPointRepository(http)
    : new InMemoryCollectionPointRepository();

  const reviews: ReviewRepository = useApi
    ? new HttpReviewRepository(http)
    : new InMemoryReviewRepository();

  const disposals: DisposalRepository = useApi
    ? new HttpDisposalRepository(http)
    : new InMemoryDisposalRepository();

  const contents: EducationalContentRepository = useApi
    ? new HttpEducationalContentRepository(http)
    : new InMemoryEducationalContentRepository();

  const auth: AuthGateway =
    env.authProvider === 'firebase' ? new FirebaseAuthGateway(http) : new InMemoryAuthGateway();
  authRef = auth;

  // Address search goes through the API, which holds the Google key (never the app).
  const places: PlacesGateway = useApi ? new HttpPlacesGateway(http) : new InMemoryPlacesGateway();

  const location = new ExpoLocationGateway();
  const geocoding = new ExpoGeocodingGateway();
  const navigation = new LinkingNavigationGateway();
  const notification = new ExpoNotificationGateway();

  logger.info('Container inicializado', {
    dataSource: env.dataSource,
    authProvider: env.authProvider,
  });

  return {
    useCases: {
      listNearbyPoints: new ListNearbyPointsUseCase(points),
      getPointDetails: new GetPointDetailsUseCase(points, reviews),
      registerCollectionPoint: new RegisterCollectionPointUseCase(points),
      registerDisposal: new RegisterDisposalUseCase(disposals, points),
      listMyDisposals: new ListMyDisposalsUseCase(disposals),
      reviewPoint: new ReviewPointUseCase(reviews),
      plotRoute: new PlotRouteUseCase(navigation, location),
      contactWhatsApp: new ContactPointWhatsAppUseCase(navigation),
      authenticateUser: new AuthenticateUserUseCase(auth),
      registerUser: new RegisterUserUseCase(auth),
      restoreSession: new RestoreSessionUseCase(auth),
      endSession: new EndSessionUseCase(auth),
      getRanking: new GetRankingUseCase(disposals),
      listEducationalContent: new ListEducationalContentUseCase(contents),
      suggestPlaces: new SuggestPlacesUseCase(points, places),
      resolvePlace: new ResolvePlaceUseCase(places),
      geocodeAddress: new GeocodeAddressUseCase(geocoding),
    },
    gateways: { location, navigation, notification, auth, places, geocoding },
    info: { dataSource: env.dataSource, authProvider: env.authProvider },
  };
}
