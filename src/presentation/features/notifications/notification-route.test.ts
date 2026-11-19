import { resolveNotificationRoute } from './notification-route';

const point = (id: string) => ({ pathname: '/point/[id]', params: { id } });

describe('resolveNotificationRoute', () => {
  it.each([
    ['/point/12', point('12')],
    ['/point/abc-123/', point('abc-123')],
    ['ecopontomobile://point/7', point('7')],
    ['/point/9?from=push#top', point('9')],
    ['/education', '/education'],
    ['/ranking', '/ranking'],
    ['/profile', '/profile'],
    ['/', '/home'],
    ['/home', '/home'],
  ])('opens the allowlisted url %s', (url, expected) => {
    expect(resolveNotificationRoute({ url })).toEqual(expected);
  });

  it.each([
    '/sign-up',
    '/_sitemap',
    'https://evil.example/point/1',
    '/point/1/../../sign-up',
    '/point/<script>',
    '/point/',
    'point/1',
  ])('ignores the url %s outside the allowlist', (url) => {
    expect(resolveNotificationRoute({ url })).toBe('/home');
  });

  it('falls back to the type when the url is not allowed', () => {
    expect(resolveNotificationRoute({ type: 'news', url: '/sign-up' })).toBe('/education');
  });

  it.each([
    [{ type: 'pickup', pointId: 5 }, point('5')],
    [{ type: 'pickup' }, '/home'],
    [{ type: 'news' }, '/education'],
    [{ type: 'promotion' }, '/profile'],
  ])('maps the type of %j', (data, expected) => {
    expect(resolveNotificationRoute(data)).toEqual(expected);
  });

  it.each([undefined, null, 'text', 42, [], { type: 'unknown' }, { url: 123 }])(
    'opens Home for an unusable payload %j',
    (data) => {
      expect(resolveNotificationRoute(data)).toBe('/home');
    },
  );
});
