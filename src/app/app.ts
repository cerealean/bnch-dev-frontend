import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { benchmark, BenchmarkResult } from './benchmarker-wrapper';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly code = signal(`// Enter your JavaScript code here to benchmark
// Example:
let sum = 0;
for (let i = 0; i < 10000; i++) {
  sum += i;
}
return sum;`);
  
  protected readonly isRunning = signal<boolean>(false);
  protected readonly result = signal<BenchmarkResult | null>(null);
  protected readonly error = signal<string | null>(null);

  protected async runBenchmark(): Promise<void> {
    const codeValue = this.code();
    
    if (!codeValue.trim()) {
      return;
    }

    this.isRunning.set(true);
    this.error.set(null);
    this.result.set(null);

    try {
      // Use worker for isolated execution and more reliable results
      const benchmarkResult = await benchmark(codeValue, {
        minSamples: 10,
        maxSamples: 100,
        maxTime: 10000, // 10 seconds max
        warmupIterations: 5,
        yieldBetweenSamples: true,
        useWorker: true // Re-enabled worker with our wrapper fix!
      });

      this.result.set(benchmarkResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      this.error.set(errorMessage);
    } finally {
      this.isRunning.set(false);
    }
  }

  protected formatNumber(num: number, decimals: number = 3): string {
    return num.toFixed(decimals);
  }

  protected formatTime(timeMs: number): string {
    if (timeMs < 1) {
      return `${this.formatNumber(timeMs * 1000, 2)}µs`;
    } else if (timeMs < 1000) {
      return `${this.formatNumber(timeMs, 3)}ms`;
    } else {
      return `${this.formatNumber(timeMs / 1000, 3)}s`;
    }
  }
}
