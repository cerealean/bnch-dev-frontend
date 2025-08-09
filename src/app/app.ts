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
    maintainAspectRatio: true,
    aspectRatio: 1,
    plugins: {
      title: {
        display: true,
        text: 'Performance Reliability'
      },
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          usePointStyle: true
        }
      }
    },
    layout: {
      padding: 10
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
    // For very small numbers, use exponential notation if needed
    if (Math.abs(num) < Math.pow(10, -decimals) && num !== 0) {
      return num.toExponential(2);
    }
    return num.toFixed(decimals);
  }

  protected formatTime(timeMs: number): string {
    // Handle null/undefined/NaN
    if (timeMs === null || timeMs === undefined || isNaN(timeMs)) {
      return "N/A";
    }
    
    // Handle true zero
    if (timeMs === 0) {
      return "0.000ns";
    }
    
    // For extremely tiny values, use attoseconds (< 0.000000001ms = 1ps)
    if (timeMs < 0.000000001) {
      const attoseconds = timeMs * 1000000000000000;
      return `${this.formatNumber(attoseconds, 3)}as`;
    }
    
    // For super small values, use femtoseconds (< 0.000001ms = 1ns)
    if (timeMs < 0.000001) {
      const femtoseconds = timeMs * 1000000000000;
      return `${this.formatNumber(femtoseconds, 3)}fs`;
    }
    
    // For extremely small values, use picoseconds (< 0.001ms = 1µs)
    if (timeMs < 0.001) {
      const picoseconds = timeMs * 1000000000;
      return `${this.formatNumber(picoseconds, 3)}ps`;
    }
    
    // For very small values, use nanoseconds (< 1ms)
    if (timeMs < 1) {
      const nanoseconds = timeMs * 1000000;
      return `${this.formatNumber(nanoseconds, 3)}ns`;
    }
    
    // For normal values, use milliseconds (< 1000ms)
    if (timeMs < 1000) {
      return `${this.formatNumber(timeMs, 3)}ms`;
    }
    
    // For large values, use seconds
    return `${this.formatNumber(timeMs / 1000, 3)}s`;
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
    
    // Show meaningful performance insights: Consistency vs Outliers
    const executionTimes = result.samples
      .filter(sample => sample.success)
      .map(sample => sample.time);
    
    if (executionTimes.length === 0) {
      // If no successful samples, show just failures
      this.statsComparisonData.set({
        labels: ['Failed Executions'],
        datasets: [{
          data: [stats.failedSamples],
          backgroundColor: ['rgba(244, 67, 54, 0.8)'],
          borderColor: ['rgba(244, 67, 54, 1)'],
          borderWidth: 2
        }]
      });
      return;
    }

    const mean = stats.mean;
    const stdDev = stats.standardDeviation;
    
    // Categorize samples by how far they deviate from the mean
    // This shows code reliability and predictability
    const veryConsistent = executionTimes.filter(time => 
      Math.abs(time - mean) <= stdDev * 0.5
    ).length;
    
    const consistent = executionTimes.filter(time => 
      Math.abs(time - mean) > stdDev * 0.5 && Math.abs(time - mean) <= stdDev
    ).length;
    
    const outliers = executionTimes.filter(time => 
      Math.abs(time - mean) > stdDev
    ).length;
    
    // Add failed samples if any
    const failed = stats.failedSamples;
    
    const data = [];
    const labels = [];
    const colors = [];
    const borderColors = [];
    
    if (veryConsistent > 0) {
      data.push(veryConsistent);
      labels.push(`Highly Consistent (${((veryConsistent / result.samples.length) * 100).toFixed(0)}%)`);
      colors.push('rgba(76, 175, 80, 0.8)');  // Green
      borderColors.push('rgba(76, 175, 80, 1)');
    }
    
    if (consistent > 0) {
      data.push(consistent);
      labels.push(`Moderately Consistent (${((consistent / result.samples.length) * 100).toFixed(0)}%)`);
      colors.push('rgba(255, 193, 7, 0.8)');  // Amber
      borderColors.push('rgba(255, 193, 7, 1)');
    }
    
    if (outliers > 0) {
      data.push(outliers);
      labels.push(`Performance Outliers (${((outliers / result.samples.length) * 100).toFixed(0)}%)`);
      colors.push('rgba(255, 152, 0, 0.8)');  // Orange
      borderColors.push('rgba(255, 152, 0, 1)');
    }
    
    if (failed > 0) {
      data.push(failed);
      labels.push(`Failed Executions (${((failed / result.samples.length) * 100).toFixed(0)}%)`);
      colors.push('rgba(244, 67, 54, 0.8)');  // Red
      borderColors.push('rgba(244, 67, 54, 1)');
    }
    
    // Ensure we have at least some data
    if (data.length === 0) {
      data.push(1);
      labels.push('No Data Available');
      colors.push('rgba(158, 158, 158, 0.8)');
      borderColors.push('rgba(158, 158, 158, 1)');
    }
    
    this.statsComparisonData.set({
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderColor: borderColors,
        borderWidth: 2
      }]
    });
  }
}
