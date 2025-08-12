import { routes } from './app.routes';

describe('AppRoutes', () => {
  it('should define routes array', () => {
    expect(routes).toBeDefined();
    expect(Array.isArray(routes)).toBe(true);
  });

  it('should start with empty routes', () => {
    expect(routes.length).toBe(0);
  });
});
