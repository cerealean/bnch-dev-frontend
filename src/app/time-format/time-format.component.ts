import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';

interface TimeFormat {
  value: string;
  tooltip: string;
}

@Component({
  selector: 'app-time-format',
  imports: [CommonModule, MatTooltipModule],
  template: `
    <span 
      [matTooltip]="formattedTime().tooltip" 
      matTooltipPosition="above"
      class="time-format">
      {{ formattedTime().value }}
    </span>
  `,
  styles: [`
    .time-format {
      cursor: help;
      text-decoration: underline;
      text-decoration-style: dotted;
      text-decoration-color: rgba(0, 0, 0, 0.3);
    }
    
    .time-format:hover {
      text-decoration-color: rgba(0, 0, 0, 0.6);
    }
  `]
})
export class TimeFormatComponent {
  @Input({ required: true }) timeMs!: number;

  protected formattedTime = computed((): TimeFormat => {
    const timeMs = this.timeMs;
    
    // Handle null/undefined/NaN
    if (timeMs === null || timeMs === undefined || isNaN(timeMs)) {
      return {
        value: "N/A",
        tooltip: "Invalid time value"
      };
    }
    
    // Handle true zero (but be more careful about floating point precision)
    if (timeMs === 0) {
      return {
        value: "<1ns",
        tooltip: "Execution time was too fast to measure accurately (less than 1 nanosecond or within measurement precision limits)"
      };
    }
    
    // Handle extremely small values that are effectively zero due to measurement precision
    if (Math.abs(timeMs) < Number.EPSILON || Math.abs(timeMs) < 0.000000001) {
      return {
        value: "<1ps",
        tooltip: "Execution time was extremely fast - within measurement precision limits (less than 1 picosecond)"
      };
    }

    // Handle negative values
    if (timeMs < 0) {
      return {
        value: "Invalid",
        tooltip: "Negative time values are not supported"
      };
    }

    const seconds = timeMs / 1000;

    // For values >= 1 second, always show in seconds
    if (seconds >= 1) {
      const roundedSeconds = this.formatNumber(seconds, 3);
      return {
        value: `${roundedSeconds}s`,
        tooltip: `${roundedSeconds} seconds or ${this.formatNumber(timeMs, 3)}ms`
      };
    }

    // For values >= 1 millisecond, show in milliseconds
    if (timeMs >= 1) {
      const roundedMs = this.formatNumber(timeMs, 3);
      return {
        value: `${roundedMs}ms`,
        tooltip: `${roundedMs} milliseconds or ${this.formatNumber(seconds, 6)} seconds`
      };
    }

    // For values >= 1 microsecond (0.001ms), show in microseconds
    if (timeMs >= 0.001) {
      const microseconds = timeMs * 1000;
      const roundedUs = this.formatNumber(microseconds, 3);
      return {
        value: `${roundedUs}µs`,
        tooltip: `${roundedUs} microseconds or ${this.formatNumber(timeMs, 6)}ms or ${this.formatNumber(seconds, 9)} seconds`
      };
    }

    // For values >= 1 nanosecond (0.000001ms), show in nanoseconds  
    if (timeMs >= 0.000001) {
      const nanoseconds = timeMs * 1000000;
      const roundedNs = this.formatNumber(nanoseconds, 3);
      return {
        value: `${roundedNs}ns`,
        tooltip: `${roundedNs} nanoseconds or ${this.formatNumber(timeMs * 1000, 6)}µs or ${this.formatNumber(seconds, 12)} seconds`
      };
    }

    // For values >= 1 picosecond (0.000000001ms), show in picoseconds
    if (timeMs >= 0.000000001) {
      const picoseconds = timeMs * 1000000000;
      const roundedPs = this.formatNumber(picoseconds, 3);
      return {
        value: `${roundedPs}ps`,
        tooltip: `${roundedPs} picoseconds or ${this.formatNumber(timeMs * 1000000, 6)}ns or ${this.formatNumber(seconds, 15)} seconds`
      };
    }

    // For extremely small values, show in femtoseconds but warn about measurement precision
    const femtoseconds = timeMs * 1000000000000;
    const roundedFs = this.formatNumber(femtoseconds, 3);
    return {
      value: `~${roundedFs}fs`,
      tooltip: `${roundedFs} femtoseconds (WARNING: This value is likely within measurement error and may not be accurate)`
    };
  });

  private formatNumber(num: number, decimals: number): string {
    if (Math.abs(num) >= 1000000) {
      return num.toExponential(2);
    }
    if (Math.abs(num) >= 100) {
      return num.toFixed(0);
    }
    if (Math.abs(num) >= 10) {
      return num.toFixed(1);
    }
    if (Math.abs(num) >= 1) {
      return num.toFixed(2);
    }
    return num.toFixed(decimals);
  }
}
