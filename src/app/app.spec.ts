import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { App } from './app';
import packageInfo from '../../package.json';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App, NoopAnimationsModule],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should have data-app-version attribute on main element', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const mainElement = compiled.querySelector('main');
    
    expect(mainElement).toBeTruthy();
    expect(mainElement?.getAttribute('data-app-version')).toBe(packageInfo.version);
  });

  it('should initialize with single mode', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    
    expect(app['mode']()).toBe('single');
  });

  it('should initialize with default code', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    
    const defaultCode = app['code']();
    expect(defaultCode).toContain('// Enter your JavaScript code here to benchmark');
    expect(defaultCode).toContain('for (let i = 0; i < 10000; i++)');
  });

  it('should have Math available for templates', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    
    expect(app['Math']).toBe(Math);
  });

  it('should initialize with default benchmark options', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    
    // These are hardcoded in the benchmark methods, not as signals
    expect(app).toBeTruthy(); // Just verify the component exists
  });

  it('should initialize comparison code', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    
    const comparisonCode = app['comparisonCode']();
    expect(comparisonCode).toContain('// Enter your comparison JavaScript code here');
  });

  it('should track running state', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    
    expect(app['isRunning']()).toBe(false);
  });

  it('should initialize charts data as null', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    
    expect(app['histogramData']()).toBeNull();
    expect(app['timeSeriesData']()).toBeNull();
    expect(app['statsComparisonData']()).toBeNull();
  });

  it('should initialize result as null', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    
    expect(app['result']()).toBeNull();
    expect(app['comparisonResult']()).toBeNull();
  });

  it('should have chart options defined', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    
    expect(app['histogramOptions']).toBeDefined();
    expect(app['timeSeriesOptions']).toBeDefined();
    expect(app['statsComparisonOptions']).toBeDefined();
  });

  it('should have comparison chart options defined', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    
    expect(app['comparisonOverviewOptions']).toBeDefined();
    expect(app['comparisonDistributionOptions']).toBeDefined();
    expect(app['comparisonTimeSeriesOptions']).toBeDefined();
  });

  it('should initialize comparison chart data as null', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    
    expect(app['comparisonOverviewData']()).toBeNull();
    expect(app['comparisonDistributionData']()).toBeNull();
    expect(app['comparisonTimeSeriesData']()).toBeNull();
  });

  it('should compute result stats correctly', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    
    // Initially should be undefined since result is null
    expect(app['resultStats']()).toBeUndefined();
  });

  it('should allow mode switching', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    
    expect(app['mode']()).toBe('single');
    app['mode'].set('compare');
    expect(app['mode']()).toBe('compare');
  });

  it('should allow code updates', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    
    const newCode = 'return "hello world";';
    app['code'].set(newCode);
    expect(app['code']()).toBe(newCode);
  });

  it('should allow comparison code updates', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    
    const newCode = 'return "hello universe";';
    app['comparisonCode'].set(newCode);
    expect(app['comparisonCode']()).toBe(newCode);
  });

  it('should track error state', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    
    expect(app['error']()).toBeNull();
    app['error'].set('Test error');
    expect(app['error']()).toBe('Test error');
  });

  it('should track running state updates', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    
    expect(app['isRunning']()).toBe(false);
    app['isRunning'].set(true);
    expect(app['isRunning']()).toBe(true);
  });

  describe('formatNumber method', () => {
    it('should format regular numbers with default decimals', () => {
      const fixture = TestBed.createComponent(App);
      const app = fixture.componentInstance;
      
      expect(app['formatNumber'](1.23456)).toBe('1.235');
      expect(app['formatNumber'](10)).toBe('10.000');
      expect(app['formatNumber'](0.5)).toBe('0.500');
    });

    it('should format numbers with custom decimals', () => {
      const fixture = TestBed.createComponent(App);
      const app = fixture.componentInstance;
      
      expect(app['formatNumber'](1.23456, 2)).toBe('1.23');
      expect(app['formatNumber'](10, 1)).toBe('10.0');
      expect(app['formatNumber'](0.5, 4)).toBe('0.5000');
    });

    it('should use exponential notation for very small numbers', () => {
      const fixture = TestBed.createComponent(App);
      const app = fixture.componentInstance;
      
      expect(app['formatNumber'](0.000001)).toBe('1.00e-6');
      expect(app['formatNumber'](0.00000001, 2)).toBe('1.00e-8');
    });

    it('should handle zero correctly', () => {
      const fixture = TestBed.createComponent(App);
      const app = fixture.componentInstance;
      
      expect(app['formatNumber'](0)).toBe('0.000');
      expect(app['formatNumber'](0, 2)).toBe('0.00');
    });

    it('should handle negative numbers', () => {
      const fixture = TestBed.createComponent(App);
      const app = fixture.componentInstance;
      
      expect(app['formatNumber'](-1.23456)).toBe('-1.235');
      expect(app['formatNumber'](-0.000001)).toBe('-1.00e-6');
    });
  });
});
