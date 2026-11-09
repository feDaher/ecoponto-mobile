import { ValidationError } from '@/core/errors';
import { Coordinate } from '@/domain/value-objects/coordinate';

import { HttpClient } from '../../http/http-client';
import { HttpCollectionPointRepository } from './http-collection-point.repository';

const BASE_URL = 'https://api.ecoponto.test';

const ORIGIN = (() => {
  const result = Coordinate.create(-20.258, -42.0336);
  if (!result.ok) throw new Error('invalid test coordinate');
  return result.value;
})();

function apiPoint(overrides: Record<string, unknown> = {}) {
  return {
    id: 'point-1',
    collectorId: 'collector-1',
    name: 'Ecoponto Centro',
    description: null,
    city: 'Manhuaçu',
    address: 'Rua Dr. Teixeira, 100',
    latitude: '-20.25800000',
    longitude: '-42.03360000',
    locationSource: 'GPS_COORDINATES',
    placeId: null,
    whatsappContact: '33999990000',
    showWhatsappContact: true,
    wasteCategories: ['PLASTIC', 'COOKING_OIL', 'ELECTRONICS'],
    operatingHours: [
      { weekday: 'MONDAY', openTime: '08:00', closeTime: '17:00' },
      { weekday: 'SUNDAY', openTime: '09:00', closeTime: '12:00' },
    ],
    status: 'APPROVED',
    hoursConfirmedAt: '2026-10-20T12:00:00.000Z',
    isOutdated: false,
    createdAt: '2026-09-01T12:00:00.000Z',
    updatedAt: '2026-09-15T12:00:00.000Z',
    distanceKm: 0.12,
    ...overrides,
  };
}

function respondWith(body: unknown, status = 200) {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

function requestedUrl(fetchMock: jest.Mock): URL {
  return new URL(String(fetchMock.mock.calls[0][0]));
}

function createRepository() {
  return new HttpCollectionPointRepository(new HttpClient(BASE_URL, 5_000, async () => null));
}

describe('HttpCollectionPointRepository.list', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('sends the combined filters using the API parameter names', async () => {
    const fetchMock = respondWith([]);

    await createRepository().list({
      city: 'Manhuaçu',
      categories: ['plastic', 'cooking-oil', 'general-electronics'],
      origin: ORIGIN,
      radiusKm: 5,
    });

    const url = requestedUrl(fetchMock);
    expect(url.origin + url.pathname).toBe(`${BASE_URL}/collection-points`);
    expect(Object.fromEntries(url.searchParams)).toEqual({
      city: 'Manhuaçu',
      wasteType: 'PLASTIC,COOKING_OIL,ELECTRONICS',
      latitude: '-20.258',
      longitude: '-42.0336',
      radius: '5',
      limit: '200',
    });
  });

  it('sends only the page size when there are no filters', async () => {
    const fetchMock = respondWith([]);

    await createRepository().list({});

    expect(Object.fromEntries(requestedUrl(fetchMock).searchParams)).toEqual({ limit: '200' });
  });

  it('does not send a radius without a reference point', async () => {
    const fetchMock = respondWith([]);

    await createRepository().list({ radiusKm: 10 });

    expect(requestedUrl(fetchMock).searchParams.has('radius')).toBe(false);
  });

  it('does not send filters the API cannot apply', async () => {
    const fetchMock = respondWith([]);

    await createRepository().list({
      neighborhood: 'Centro',
      onlyOpen: true,
      searchTerm: 'centro',
      statuses: ['approved'],
    });

    expect(Object.fromEntries(requestedUrl(fetchMock).searchParams)).toEqual({ limit: '200' });
  });

  it('translates the API payload into domain entities', async () => {
    respondWith([apiPoint()]);

    const result = await createRepository().list({});

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const [point] = result.value;
    expect(point.id).toBe('point-1');
    expect(point.status).toBe('approved');
    expect(point.categories).toEqual(['plastic', 'cooking-oil', 'general-electronics']);
    expect(point.coordinate.latitude).toBeCloseTo(-20.258);
    expect(point.coordinate.longitude).toBeCloseTo(-42.0336);
    expect(point.openingHours.map((hours) => hours.weekday)).toEqual([1, 0]);
    expect(point.openingHours[0].opensAt).toBe('08:00');
    expect(point.isWhatsAppAvailable).toBe(true);
    expect(point.updatedAt.toISOString()).toBe('2026-10-20T12:00:00.000Z');
  });

  it('keeps the point but drops waste types the app does not know', async () => {
    respondWith([apiPoint({ wasteCategories: ['PLASTIC', 'HOLOGRAMS'] })]);

    const result = await createRepository().list({});

    expect(result.ok && result.value[0].categories).toEqual(['plastic']);
  });

  it('discards a point whose only waste types are unknown, without failing the list', async () => {
    respondWith([
      apiPoint({ id: 'bad', wasteCategories: ['HOLOGRAMS'] }),
      apiPoint({ id: 'good' }),
    ]);

    const result = await createRepository().list({});

    expect(result.ok && result.value.map((point) => point.id)).toEqual(['good']);
  });

  it('maps the API statuses, treating INACTIVE as suspended', async () => {
    respondWith([
      apiPoint({ id: 'a', status: 'PENDING' }),
      apiPoint({ id: 'b', status: 'REJECTED' }),
      apiPoint({ id: 'c', status: 'INACTIVE' }),
    ]);

    const result = await createRepository().list({});

    expect(result.ok && result.value.map((point) => point.status)).toEqual([
      'pending',
      'rejected',
      'suspended',
    ]);
  });

  it('treats the WhatsApp number as unavailable when the API hides it', async () => {
    respondWith([apiPoint({ whatsappContact: null, showWhatsappContact: false })]);

    const result = await createRepository().list({});

    expect(result.ok && result.value[0].isWhatsAppAvailable).toBe(false);
  });

  describe('free-text refinement', () => {
    const points = () => [
      apiPoint({ id: 'a', name: 'Cooperativa Verde', address: 'Rua das Flores, 1' }),
      apiPoint({ id: 'b', name: 'Ecoponto Centro', address: 'Avenida Brasil, 2' }),
    ];

    it('matches the name ignoring case and accents', async () => {
      respondWith(points());

      const result = await createRepository().list({ searchTerm: ' COOPERATIVÁ ' });

      expect(result.ok && result.value.map((point) => point.id)).toEqual(['a']);
    });

    it('matches the address', async () => {
      respondWith(points());

      const result = await createRepository().list({ searchTerm: 'brasil' });

      expect(result.ok && result.value.map((point) => point.id)).toEqual(['b']);
    });

    it('returns nothing when there is no match and everything for a blank term', async () => {
      respondWith(points());
      const none = await createRepository().list({ searchTerm: 'xyz' });

      respondWith(points());
      const all = await createRepository().list({ searchTerm: '   ' });

      expect(none.ok && none.value).toEqual([]);
      expect(all.ok && all.value).toHaveLength(2);
    });
  });

  it('turns a 400 from the API into a validation error carrying its message', async () => {
    respondWith({ message: 'Validation error: raio inválido' }, 400);

    const result = await createRepository().list({});

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(ValidationError);
    expect(result.error.message).toBe('Validation error: raio inválido');
  });

  it('fails with a contract error when the response is not a list', async () => {
    respondWith({ unexpected: true });

    const result = await createRepository().list({});

    expect(result.ok).toBe(false);
  });
});

describe('HttpCollectionPointRepository.getById', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('requests the point by id and translates the payload', async () => {
    const fetchMock = respondWith(apiPoint({ id: 'abc/1' }));

    const result = await createRepository().getById('abc/1');

    expect(requestedUrl(fetchMock).pathname).toBe('/collection-points/abc%2F1');
    expect(result.ok && result.value.categories).toEqual([
      'plastic',
      'cooking-oil',
      'general-electronics',
    ]);
  });
});
