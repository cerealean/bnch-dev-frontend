import { appConfig } from './app.config';

describe('AppConfig', () => {
  it('should provide application configuration', () => {
    expect(appConfig).toBeDefined();
    expect(appConfig.providers).toBeDefined();
    expect(appConfig.providers.length).toBeGreaterThan(0);
  });

  it('should provide required application providers', () => {
    expect(appConfig.providers).toBeDefined();
    expect(appConfig.providers.length).toBe(4); // 4 providers are configured
  });
});
