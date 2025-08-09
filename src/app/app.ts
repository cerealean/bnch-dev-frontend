import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, ChartType, registerables } from 'chart.js';
import { benchmark, BenchmarkResult } from './benchmarker-wrapper';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    FormsModule,
    BaseChartDirective,
    MatTabsModule
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

  // Chart data and configuration
  protected readonly histogramData = signal<ChartData<'bar'> | null>(null);
  protected readonly timeSeriesData = signal<ChartData<'line'> | null>(null);
  protected readonly statsComparisonData = signal<ChartData<'doughnut'> | null>(null);

  protected readonly histogramOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Execution Time Distribution'
      },
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Execution Time (ms)'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Frequency'
        }
      }
    }
  };

  protected readonly timeSeriesOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Execution Time Over Samples'
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Sample Number'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Execution Time (ms)'
        }
      }
    }
  };

  protected readonly statsComparisonOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Statistical Breakdown'
      }
    }
  };

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
      this.generateChartData(benchmarkResult);
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

  private generateChartData(result: BenchmarkResult): void {
    this.generateHistogramData(result);
    this.generateTimeSeriesData(result);
    this.generateStatsComparisonData(result);
  }

  private generateHistogramData(result: BenchmarkResult): void {
    const executionTimes = result.samples
      .filter(sample => sample.success)
      .map(sample => sample.time);

    // Create histogram bins
    const min = Math.min(...executionTimes);
    const max = Math.max(...executionTimes);
    const binCount = Math.min(20, Math.max(5, Math.ceil(Math.sqrt(executionTimes.length))));
    const binSize = (max - min) / binCount;

    const bins = Array(binCount).fill(0);
    const binLabels = [];

    for (let i = 0; i < binCount; i++) {
      const binStart = min + i * binSize;
      const binEnd = min + (i + 1) * binSize;
      binLabels.push(`${this.formatNumber(binStart, 2)}-${this.formatNumber(binEnd, 2)}`);
    }

    executionTimes.forEach(time => {
      const binIndex = Math.min(Math.floor((time - min) / binSize), binCount - 1);
      bins[binIndex]++;
    });

    this.histogramData.set({
      labels: binLabels,
      datasets: [{
        data: bins,
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    });
  }

  private generateTimeSeriesData(result: BenchmarkResult): void {
    const executionTimes = result.samples
      .filter(sample => sample.success)
      .map(sample => sample.time);

    const sampleNumbers = executionTimes.map((_, index) => index + 1);

    this.timeSeriesData.set({
      labels: sampleNumbers.map(n => n.toString()),
      datasets: [{
        label: 'Execution Time',
        data: executionTimes,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: false,
        tension: 0.1
      }, {
        label: 'Mean',
        data: Array(executionTimes.length).fill(result.stats.mean),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderDash: [5, 5],
        fill: false
      }]
    });
  }

  private generateStatsComparisonData(result: BenchmarkResult): void {
    const stats = result.stats;
    
    // Create a visual comparison of key statistics
    const data = [
      stats.min,
      stats.median - stats.min,
      stats.mean - stats.median,
      stats.max - stats.mean
    ];

    const labels = [
      `Min: ${this.formatTime(stats.min)}`,
      `Min to Median: ${this.formatTime(stats.median - stats.min)}`,
      `Median to Mean: ${this.formatTime(stats.mean - stats.median)}`,
      `Mean to Max: ${this.formatTime(stats.max - stats.mean)}`
    ];

    this.statsComparisonData.set({
      labels,
      datasets: [{
        data,
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 205, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 205, 86, 1)',
          'rgba(75, 192, 192, 1)'
        ],
        borderWidth: 1
      }]
    });
  }
}
