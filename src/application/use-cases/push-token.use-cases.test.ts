import { NetworkError } from '@/core/errors';
import { err, ok } from '@/core/result';

import type { NotificationGateway } from '../ports/notification.gateway';
import type { PushTokenRepository } from '../ports/push-token.repository';
import { RegisterPushTokenUseCase, UnregisterPushTokenUseCase } from './push-token.use-cases';

const TOKEN = 'ExponentPushToken[abc]';

function setup(deviceToken: string | null) {
  const registerDevice = jest
    .fn<ReturnType<NotificationGateway['registerDevice']>, []>()
    .mockResolvedValue(ok(deviceToken));
  const gateway = {
    registerDevice,
  } as unknown as NotificationGateway;

  const repository: jest.Mocked<PushTokenRepository> = {
    register: jest.fn().mockResolvedValue(ok()),
    unregister: jest.fn().mockResolvedValue(ok()),
  };

  const register = new RegisterPushTokenUseCase(gateway, repository);
  const unregister = new UnregisterPushTokenUseCase(register, repository);
  return { registerDevice, repository, register, unregister };
}

describe('RegisterPushTokenUseCase', () => {
  it('saves the device token for the user', async () => {
    const { repository, register } = setup(TOKEN);

    await expect(register.execute()).resolves.toEqual(ok(TOKEN));
    expect(repository.register).toHaveBeenCalledWith(TOKEN);
    expect(register.currentTokens).toEqual([TOKEN]);
  });

  it('returns null without calling the API when push is unavailable', async () => {
    const { repository, register } = setup(null);

    await expect(register.execute()).resolves.toEqual(ok(null));
    expect(repository.register).not.toHaveBeenCalled();
  });

  it('propagates an API failure and keeps no token', async () => {
    const { repository, register } = setup(TOKEN);
    const failure = new NetworkError();
    repository.register.mockResolvedValueOnce(err(failure));

    await expect(register.execute()).resolves.toEqual(err(failure));
    expect(register.currentTokens).toEqual([]);
  });

  it('tracks rotated tokens without duplicating an existing token', async () => {
    const { registerDevice, register } = setup(TOKEN);
    registerDevice
      .mockResolvedValueOnce(ok(TOKEN))
      .mockResolvedValueOnce(ok('ExponentPushToken[rotated]'))
      .mockResolvedValueOnce(ok('ExponentPushToken[rotated]'));

    await register.execute();
    await register.execute();
    await register.execute();

    expect(register.currentTokens).toEqual([TOKEN, 'ExponentPushToken[rotated]']);
  });
});

describe('UnregisterPushTokenUseCase', () => {
  it('removes the registered token and forgets it', async () => {
    const { repository, register, unregister } = setup(TOKEN);
    await register.execute();

    await expect(unregister.execute()).resolves.toEqual(ok());
    expect(repository.unregister).toHaveBeenCalledWith(TOKEN);
    expect(register.currentTokens).toEqual([]);
  });

  it('does nothing when no token was registered', async () => {
    const { repository, unregister } = setup(null);

    await expect(unregister.execute()).resolves.toEqual(ok());
    expect(repository.unregister).not.toHaveBeenCalled();
  });

  it('continues removing rotated tokens when one removal fails', async () => {
    const { registerDevice, repository, register, unregister } = setup(TOKEN);
    const rotatedToken = 'ExponentPushToken[rotated]';
    const failure = new NetworkError();
    registerDevice.mockResolvedValueOnce(ok(TOKEN)).mockResolvedValueOnce(ok(rotatedToken));
    repository.unregister.mockImplementation(async (token) =>
      token === TOKEN ? err(failure) : ok(),
    );

    await register.execute();
    await register.execute();

    await expect(unregister.execute()).resolves.toEqual(err(failure));
    expect(repository.unregister).toHaveBeenNthCalledWith(1, TOKEN);
    expect(repository.unregister).toHaveBeenNthCalledWith(2, rotatedToken);
    expect(register.currentTokens).toEqual([TOKEN]);
  });
});
