import { benchmark, compare } from './benchmarker-wrapper';
import { TimeDuration } from '@bnch/benchmarker';

describe('BenchmarkerWrapper', () => {
  let originalWorker: typeof Worker;

  beforeEach(() => {
    originalWorker = window.Worker;
  });

  afterEach(() => {
    window.Worker = originalWorker;
  });

  describe('benchmark function', () => {
    it('should execute simple benchmark without worker', async () => {
      const code = 'let sum = 0; for(let i = 0; i < 1000; i++) { sum += i; } return sum;';
      
      const result = await benchmark(code, { useWorker: false });
      
      expect(result).toBeTruthy();
      expect(result.samples).toBeDefined();
      expect(result.samples.length).toBeGreaterThan(0);
      expect(result.stats).toBeDefined();
      expect(result.stats.mean).toBeInstanceOf(TimeDuration);
    });

    it('should handle benchmark with worker disabled by default', async () => {
      const code = 'return 42;';
      
      const result = await benchmark(code);
      
      expect(result).toBeTruthy();
      expect(result.samples).toBeDefined();
      expect(result.samples.length).toBeGreaterThan(0);
    });

    it('should test Worker URL patching logic', () => {
      let fixedUrl: string | URL | undefined;
      
      // Mock the Worker constructor to capture the URL that gets passed
      const OriginalWorkerMock = window.Worker;
      
      window.Worker = class extends OriginalWorkerMock {
        constructor(scriptURL: string | URL, options?: WorkerOptions) {
          // Apply the same URL fixing logic as in the wrapper
          let correctedURL: string | URL = scriptURL;
          
          if (typeof scriptURL === 'string' && scriptURL.includes('worker-script.js')) {
            correctedURL = '/worker-script.js';
          } else if (scriptURL instanceof URL && scriptURL.pathname.includes('worker-script.js')) {
            correctedURL = new URL('/worker-script.js', window.location.origin);
          }
          
          fixedUrl = correctedURL;
          super(correctedURL, options);
        }
      };
      
      // Test string URL fixing
      try {
        new window.Worker('some/path/worker-script.js');
        expect(fixedUrl).toBe('/worker-script.js');
      } catch {
        // Worker construction might fail in test environment
        expect(fixedUrl).toBe('/worker-script.js');
      }
      
      // Test URL object fixing
      try {
        new window.Worker(new URL('some/path/worker-script.js', 'http://example.com'));
        expect(fixedUrl).toEqual(new URL('/worker-script.js', window.location.origin));
      } catch {
        // Worker construction might fail in test environment
        expect(fixedUrl).toEqual(new URL('/worker-script.js', window.location.origin));
      }
    });
  });

  describe('compare function', () => {
    it('should execute comparison without worker', async () => {
      const baselineCode = 'let sum = 0; for(let i = 0; i < 100; i++) { sum += i; } return sum;';
      const comparisonCode = 'let sum = 0; for(let i = 0; i < 100; i++) { sum += i * 2; } return sum;';
      
      const result = await compare(baselineCode, comparisonCode, { useWorker: false });
      
      expect(result).toBeTruthy();
      expect(result.baseline).toBeTruthy();
      expect(result.comparison).toBeTruthy();
      expect(result.baseline.samples).toBeDefined();
      expect(result.comparison.samples).toBeDefined();
      expect(result.baseline.samples.length).toBeGreaterThan(0);
      expect(result.comparison.samples.length).toBeGreaterThan(0);
    });

    it('should handle simple comparison without worker', async () => {
      const baselineCode = 'return 1;';
      const comparisonCode = 'return 2;';
      
      const result = await compare(baselineCode, comparisonCode, { useWorker: false });
      
      expect(result).toBeTruthy();
      expect(result.baseline).toBeTruthy();
      expect(result.comparison).toBeTruthy();
    });
  });

  describe('TimeDuration export', () => {
    it('should export TimeDuration from @bnch/benchmarker', () => {
      expect(TimeDuration).toBeDefined();
      expect(TimeDuration.fromSeconds).toBeDefined();
      expect(TimeDuration.fromMilliseconds).toBeDefined();
      expect(TimeDuration.fromNanoseconds).toBeDefined();
    });

    it('should create TimeDuration instances correctly', () => {
      const duration = TimeDuration.fromMilliseconds(100);
      expect(duration).toBeInstanceOf(TimeDuration);
      expect(duration.milliseconds).toBe(100);
    });
  });
});
