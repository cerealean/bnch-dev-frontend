import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

describe('Main Bootstrap', () => {
  it('should have bootstrap function available', () => {
    expect(bootstrapApplication).toBeDefined();
    expect(typeof bootstrapApplication).toBe('function');
  });

  it('should have app config defined', () => {
    expect(appConfig).toBeDefined();
    expect(appConfig.providers).toBeDefined();
  });

  it('should have App component defined', () => {
    expect(App).toBeDefined();
    expect(typeof App).toBe('function');
  });
});
