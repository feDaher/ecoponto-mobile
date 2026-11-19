import { apiDisposalDtoSchema, apiLoginResponseSchema, apiUserDtoSchema } from './api.schemas';

/** Payloads copied from ecoponto-api responses, so a contract change shows up here. */
describe('ecoponto-api contract', () => {
  it('translates the API user, whose role is uppercase and has no points', () => {
    const user = apiUserDtoSchema.parse({
      id: '0f572509',
      firebaseUid: 'C1lfYL1j',
      email: 'cidadao@ecoponto.dev',
      role: 'CITIZEN',
      name: 'Cidadão Teste',
      phone: '33999990003',
      city: 'Manhuaçu',
      createdAt: '2026-09-27T21:24:26.357Z',
    });

    expect(user).toMatchObject({ id: '0f572509', role: 'citizen', points: null, city: 'Manhuaçu' });
    expect(user.registeredAt.toISOString()).toBe('2026-09-27T21:24:26.357Z');
  });

  it('reads the login session, with expiresIn as Firebase sends it (seconds, as text)', () => {
    const session = apiLoginResponseSchema.parse({
      idToken: 'id',
      refreshToken: 'refresh',
      expiresIn: '3600',
      user: {
        id: 'u1',
        email: 'coletor@ecoponto.dev',
        role: 'COLLECTOR',
        name: 'Cooperativa',
        phone: '33999990002',
        city: 'Manhuaçu',
        createdAt: '2026-09-27T21:24:26.357Z',
      },
    });

    expect(session.expiresIn).toBe(3600);
    expect(session.user.role).toBe('collector');
  });

  it('translates a pending disposal: category by code, no points yet', () => {
    const disposal = apiDisposalDtoSchema.parse({
      id: 'd1',
      citizenId: 'u1',
      collectionPointId: 'p1',
      categoryId: 'uuid-cell-phones',
      weightKg: 0.4,
      pointsEarned: 0,
      status: 'PENDING',
      disposedAt: '2026-11-19T12:00:00.000Z',
      createdAt: '2026-11-19T12:00:00.000Z',
      updatedAt: '2026-11-19T12:00:00.000Z',
      collectionPoint: {
        id: 'p1',
        name: 'UniFacig',
        city: 'Manhuaçu',
        address: 'Av.',
        collectorId: 'c1',
      },
      category: { id: 'uuid-cell-phones', name: 'CELL_PHONES' },
    });

    expect(disposal).toMatchObject({
      categoryId: 'cell-phones',
      status: 'pending',
      pointsEarned: 0,
      collectionPointName: 'UniFacig',
    });
  });
});
