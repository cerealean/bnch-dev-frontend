import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { benchmark, BenchmarkResult } from '@bnch/benchmarker';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('JavaScript Benchmarker');
  protected readonly code = signal(`// Enter your JavaScript code here to benchmark
// Example:
let sum = 0;
for (let i = 0; i < 10000; i++) {
  sum += i;
}
return sum;`);
  
  protected readonly isRunning = signal(false);
  protected readonly result = signal<BenchmarkResult | null>(null);
  protected readonly error = signal<string | null>(null);

  constructor(private snackBar: MatSnackBar) {}

  protected async runBenchmark(): Promise<void> {
    const codeValue = this.code();
    
    if (!codeValue.trim()) {
      this.snackBar.open('Please enter some code to benchmark', 'Close', { duration: 3000 });
      return;
    }

    this.isRunning.set(true);
    this.error.set(null);
    this.result.set(null);

    try {
      const benchmarkResult = await benchmark(codeValue, {
        minSamples: 10,
        maxSamples: 100,
        maxTime: 10000, // 10 seconds max
        warmupIterations: 5,
        yieldBetweenSamples: true,
        useWorker: true
      });

      this.result.set(benchmarkResult);
      this.snackBar.open('Benchmark completed successfully!', 'Close', { duration: 3000 });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      this.error.set(errorMessage);
      this.snackBar.open(`Benchmark failed: ${errorMessage}`, 'Close', { duration: 5000 });
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
