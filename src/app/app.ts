import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, registerables } from 'chart.js';
import { benchmark, compare, BenchmarkResult, BenchmarkComparison } from './benchmarker-wrapper';
import { TimeFormatComponent } from './time-format/time-format.component';
import { TimeDuration } from '@bnch/benchmarker'
import { version as appVersion } from '../../package.json';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    FormsModule,
    BaseChartDirective,
    MatTabsModule,
    MatButtonToggleModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    TimeFormatComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly appVersion = appVersion;
  protected readonly Math = Math;

  // Mode management
  protected readonly mode = signal<'single' | 'compare'>('single');

  protected readonly code = signal(`// Enter your JavaScript code here to benchmark
// Example - simple multiplication:
let sum = 0;
for (let i = 0; i < 10000; i++) {
  sum += i * 1;
}
return sum;`);

  protected readonly comparisonCode = signal(`// Enter your comparison JavaScript code here
// Example - using Math.pow instead of simple multiplication:
let sum = 0;
for (let i = 0; i < 10000; i++) {
  sum += Math.pow(i, 1);
}
return sum;`);
  
  protected readonly isRunning = signal<boolean>(false);
  protected readonly result = signal<BenchmarkResult | null>(null);
  protected readonly comparisonResult = signal<BenchmarkComparison | null>(null);
  protected readonly resultStats = computed(() => this.result()?.stats);
  protected readonly error = signal<string | null>(null);

  // Chart data and configuration
  protected readonly histogramData = signal<ChartData<'bar'> | null>(null);
  protected readonly timeSeriesData = signal<ChartData<'line'> | null>(null);
  protected readonly statsComparisonData = signal<ChartData<'doughnut'> | null>(null);
  
  // Comparison chart data
  protected readonly comparisonOverviewData = signal<ChartData<'bar'> | null>(null);
  protected readonly comparisonDistributionData = signal<ChartData<'bar'> | null>(null);
  protected readonly comparisonTimeSeriesData = signal<ChartData<'line'> | null>(null);

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

  protected readonly comparisonOverviewOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Performance Comparison Overview'
      },
      legend: {
        display: true,
        position: 'top'
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Metrics'
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

  protected readonly comparisonDistributionOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Execution Time Distribution Comparison'
      },
      legend: {
        display: true,
        position: 'top'
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Execution Time Range (ms)'
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

  protected readonly comparisonTimeSeriesOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Execution Time Over Samples - Side by Side'
      },
      legend: {
        display: true,
        position: 'top'
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

  protected async runBenchmark(): Promise<void> {
    const currentMode = this.mode();
    const codeValue = this.code();
    
    if (!codeValue.trim()) {
      return;
    }

    if (currentMode === 'compare') {
      const comparisonCodeValue = this.comparisonCode();
      if (!comparisonCodeValue.trim()) {
        this.error.set('Both baseline and comparison code must be provided for comparison mode.');
        return;
      }
      await this.runComparison(codeValue, comparisonCodeValue);
    } else {
      await this.runSingleBenchmark(codeValue);
    }
  }

  private async runSingleBenchmark(codeValue: string): Promise<void> {
    this.isRunning.set(true);
    this.error.set(null);
    this.result.set(null);
    this.comparisonResult.set(null);

    try {
      // Use worker for isolated execution and more reliable results
      const benchmarkResult = await benchmark(codeValue, {
        minSamples: 5, // Reduced for faster testing
        maxSamples: 20, // Reduced for faster testing
        maxTime: TimeDuration.fromSeconds(5), // Reduced for faster testing
        warmupIterations: 2, // Reduced for faster testing
        yieldBetweenSamples: true,
        useWorker: false // Disable worker for faster testing
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

  private async runComparison(baselineCode: string, comparisonCode: string): Promise<void> {
    this.isRunning.set(true);
    this.error.set(null);
    this.result.set(null);
    this.comparisonResult.set(null);

    try {
      console.log('Starting comparison benchmark...');
      
      // Use worker for isolated execution and more reliable results
      const comparisonResult = await compare(baselineCode, comparisonCode, {
        minSamples: 5, // Reduced for faster testing
        maxSamples: 20, // Reduced for faster testing
        maxTime: TimeDuration.fromSeconds(5), // Reduced for faster testing
        warmupIterations: 2, // Reduced for faster testing
        yieldBetweenSamples: true,
        useWorker: false // Try without worker first to debug
      });

      console.log('Comparison completed successfully');
      this.comparisonResult.set(comparisonResult);
      this.generateComparisonChartData(comparisonResult);
    } catch (err) {
      console.error('Comparison error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      this.error.set(errorMessage);
    } finally {
      this.isRunning.set(false);
    }
  }

  protected formatNumber(num: number, decimals = 3): string {
    // For very small numbers, use exponential notation if needed
    if (Math.abs(num) < Math.pow(10, -decimals) && num !== 0) {
      return num.toExponential(2);
    }
    return num.toFixed(decimals);
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
        data: Array(executionTimes.length).fill(result.stats.mean.milliseconds),
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

    const mean = stats.mean.milliseconds;
    const stdDev = stats.standardDeviation.milliseconds;

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
  
  private generateComparisonChartData(comparisonResult: BenchmarkComparison): void {
    this.generateComparisonOverviewData(comparisonResult);
    this.generateComparisonDistributionData(comparisonResult);
    this.generateComparisonTimeSeriesData(comparisonResult);
  }

  private generateComparisonOverviewData(comparisonResult: BenchmarkComparison): void {
    const baselineStats = comparisonResult.baseline.stats;
    const comparisonStats = comparisonResult.comparison.stats;

    const metrics = ['Mean', 'Median', 'Min', 'Max', 'Std Dev'];
    const baselineData = [
      baselineStats.mean.milliseconds,
      baselineStats.median.milliseconds,
      baselineStats.min.milliseconds,
      baselineStats.max.milliseconds,
      baselineStats.standardDeviation.milliseconds
    ];
    const comparisonData = [
      comparisonStats.mean.milliseconds,
      comparisonStats.median.milliseconds,
      comparisonStats.min.milliseconds,
      comparisonStats.max.milliseconds,
      comparisonStats.standardDeviation.milliseconds
    ];

    this.comparisonOverviewData.set({
      labels: metrics,
      datasets: [{
        label: 'Baseline Code',
        data: baselineData,
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }, {
        label: 'Comparison Code',
        data: comparisonData,
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }]
    });
  }

  private generateComparisonDistributionData(comparisonResult: BenchmarkComparison): void {
    const baselineExecutionTimes = comparisonResult.baseline.samples
      .filter(sample => sample.success)
      .map(sample => sample.time);
    
    const comparisonExecutionTimes = comparisonResult.comparison.samples
      .filter(sample => sample.success)
      .map(sample => sample.time);

    // Create histogram bins for both datasets
    const allTimes = [...baselineExecutionTimes, ...comparisonExecutionTimes];
    const min = Math.min(...allTimes);
    const max = Math.max(...allTimes);
    const binCount = Math.min(15, Math.max(5, Math.ceil(Math.sqrt(allTimes.length))));
    const binSize = (max - min) / binCount;

    const baselineBins = Array(binCount).fill(0);
    const comparisonBins = Array(binCount).fill(0);
    const binLabels = [];

    for (let i = 0; i < binCount; i++) {
      const binStart = min + i * binSize;
      const binEnd = min + (i + 1) * binSize;
      binLabels.push(`${this.formatNumber(binStart, 2)}-${this.formatNumber(binEnd, 2)}`);
    }

    baselineExecutionTimes.forEach(time => {
      const binIndex = Math.min(Math.floor((time - min) / binSize), binCount - 1);
      baselineBins[binIndex]++;
    });

    comparisonExecutionTimes.forEach(time => {
      const binIndex = Math.min(Math.floor((time - min) / binSize), binCount - 1);
      comparisonBins[binIndex]++;
    });

    this.comparisonDistributionData.set({
      labels: binLabels,
      datasets: [{
        label: 'Baseline Code',
        data: baselineBins,
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }, {
        label: 'Comparison Code',
        data: comparisonBins,
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }]
    });
  }

  private generateComparisonTimeSeriesData(comparisonResult: BenchmarkComparison): void {
    const baselineExecutionTimes = comparisonResult.baseline.samples
      .filter(sample => sample.success)
      .map(sample => sample.time);
      
    const comparisonExecutionTimes = comparisonResult.comparison.samples
      .filter(sample => sample.success)
      .map(sample => sample.time);

    const maxSamples = Math.max(baselineExecutionTimes.length, comparisonExecutionTimes.length);
    const sampleNumbers = Array.from({ length: maxSamples }, (_, i) => i + 1);

    this.comparisonTimeSeriesData.set({
      labels: sampleNumbers.map(n => n.toString()),
      datasets: [{
        label: 'Baseline Code',
        data: baselineExecutionTimes,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: false,
        tension: 0.1
      }, {
        label: 'Comparison Code',
        data: comparisonExecutionTimes,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: false,
        tension: 0.1
      }]
    });
  }
}
