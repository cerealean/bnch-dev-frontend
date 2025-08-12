import { benchmark as originalBenchmark, compare as originalCompare, BenchmarkConfig, BenchmarkResult, BenchmarkComparison } from '@bnch/benchmarker';

/**
 * Wrapper around the @bnch/benchmarker library that fixes worker script loading
 * in Vite-based Angular applications.
 */
export async function benchmark(code: string, options: Partial<BenchmarkConfig> = {}): Promise<BenchmarkResult> {
  // If useWorker is true, we need to patch the Worker constructor temporarily
  if (options.useWorker) {
    const originalWorker = window.Worker;
    
    // Create a patched Worker constructor that fixes the worker script URL
    window.Worker = class extends Worker {
      constructor(scriptURL: string | URL, options?: WorkerOptions) {
        let fixedURL: string | URL = scriptURL;
        
        // If the URL looks like it's trying to load worker-script.js from the wrong location
        if (typeof scriptURL === 'string' && scriptURL.includes('worker-script.js')) {
          fixedURL = '/worker-script.js'; // Use the version we copied to public/
        } else if (scriptURL instanceof URL && scriptURL.pathname.includes('worker-script.js')) {
          fixedURL = new URL('/worker-script.js', window.location.origin);
        }
        
        super(fixedURL, options);
      }
    };
    
    try {
      // Run the benchmark with the patched Worker
      const result = await originalBenchmark(code, options);
      return result;
    } finally {
      // Restore the original Worker constructor
      window.Worker = originalWorker;
    }
  } else {
    // For non-worker benchmarks, use the original function directly
    return originalBenchmark(code, options);
  }
}

/**
 * Wrapper around the @bnch/benchmarker compare function that fixes worker script loading
 * in Vite-based Angular applications.
 */
export async function compare(baselineCode: string, comparisonCode: string, options: Partial<BenchmarkConfig> = {}): Promise<BenchmarkComparison> {
  // If useWorker is true, we need to patch the Worker constructor temporarily
  if (options.useWorker) {
    const originalWorker = window.Worker;
    
    // Create a patched Worker constructor that fixes the worker script URL
    window.Worker = class extends Worker {
      constructor(scriptURL: string | URL, options?: WorkerOptions) {
        let fixedURL: string | URL = scriptURL;
        
        // If the URL looks like it's trying to load worker-script.js from the wrong location
        if (typeof scriptURL === 'string' && scriptURL.includes('worker-script.js')) {
          fixedURL = '/worker-script.js'; // Use the version we copied to public/
        } else if (scriptURL instanceof URL && scriptURL.pathname.includes('worker-script.js')) {
          fixedURL = new URL('/worker-script.js', window.location.origin);
        }
        
        super(fixedURL, options);
      }
    };
    
    try {
      // Run the comparison with the patched Worker
      const result = await originalCompare(baselineCode, comparisonCode, options);
      return result;
    } finally {
      // Restore the original Worker constructor
      window.Worker = originalWorker;
    }
  } else {
    // For non-worker comparisons, use the original function directly
    return originalCompare(baselineCode, comparisonCode, options);
  }
}

// Re-export types for convenience
export type { BenchmarkConfig, BenchmarkResult, BenchmarkComparison } from '@bnch/benchmarker';
export { TimeDuration } from '@bnch/benchmarker';
