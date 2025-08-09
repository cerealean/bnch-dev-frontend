import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { TimeDuration } from '../benchmarker-wrapper';

interface TimeFormat {
  value: string;
  tooltip: string;
}

interface TimeUnit {
  key: string;
  name: string;
  symbol: string;
  multiplier: number; // multiplier to convert from milliseconds
  description: string;
}

@Component({
  selector: 'app-time-format',
  imports: [CommonModule, MatTooltipModule, MatMenuModule, MatButtonModule, MatIconModule, MatDividerModule],
  template: `
    <button 
      mat-button
      [matMenuTriggerFor]="timeMenu"
      class="time-format-button"
      [matTooltip]="formattedTime().tooltip"
      matTooltipPosition="above">
      <span class="time-value">{{ formattedTime().value }}</span>
      <mat-icon class="dropdown-icon">arrow_drop_down</mat-icon>
    </button>

    <mat-menu #timeMenu="matMenu" class="time-menu">
      <div class="menu-header">Choose time unit:</div>
      @for (unit of availableUnits(); track unit.key) {
        <button 
          mat-menu-item 
          (click)="selectUnit(unit.key)"
          [class.selected]="selectedUnit() === unit.key">
          <mat-icon>{{ selectedUnit() === unit.key ? 'radio_button_checked' : 'radio_button_unchecked' }}</mat-icon>
          <span class="unit-name">{{ unit.name }}</span>
          <span class="unit-symbol">({{ unit.symbol }})</span>
          <span class="unit-value">{{ formatInUnit(unit) }}</span>
        </button>
      }
      <mat-divider></mat-divider>
      <button mat-menu-item (click)="selectUnit('auto')" [class.selected]="selectedUnit() === 'auto'">
        <mat-icon>{{ selectedUnit() === 'auto' ? 'radio_button_checked' : 'radio_button_unchecked' }}</mat-icon>
        <span class="unit-name">Auto</span>
        <span class="unit-description">Best fit</span>
      </button>
    </mat-menu>
  `,
  styles: [`
    .time-format-button {
      min-height: unset !important;
      line-height: 1.2 !important;
      padding: 4px 8px !important;
      border-radius: 4px !important;
      border: 1px solid rgba(0, 0, 0, 0.12) !important;
      background: rgba(0, 0, 0, 0.02) !important;
      color: inherit !important;
      font-family: inherit !important;
      font-size: inherit !important;
      transition: all 0.2s ease !important;
    }
    
    .time-format-button:hover {
      background: rgba(0, 0, 0, 0.08) !important;
      border-color: rgba(0, 0, 0, 0.24) !important;
    }
    
    .time-value {
      margin-right: 4px;
      font-weight: 500;
    }
    
    .dropdown-icon {
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
      opacity: 0.6;
    }
    
    .time-menu {
      min-width: 280px !important;
    }
    
    .menu-header {
      padding: 12px 16px 8px;
      font-size: 12px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.6);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .mat-mdc-menu-item {
      min-height: 40px !important;
      padding: 0 16px !important;
    }
    
    .mat-mdc-menu-item.selected {
      background-color: rgba(63, 81, 181, 0.08) !important;
      color: #3f51b5 !important;
    }
    
    .mat-mdc-menu-item mat-icon {
      margin-right: 12px !important;
      color: rgba(0, 0, 0, 0.54) !important;
    }
    
    .mat-mdc-menu-item.selected mat-icon {
      color: #3f51b5 !important;
    }
    
    .unit-name {
      flex: 1;
      font-weight: 500;
    }
    
    .unit-symbol {
      margin-left: 8px;
      opacity: 0.7;
      font-size: 0.9em;
    }
    
    .unit-value {
      margin-left: auto;
      padding-left: 16px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
      opacity: 0.8;
      min-width: 80px;
      text-align: right;
    }
    
    .unit-description {
      margin-left: auto;
      padding-left: 16px;
      font-style: italic;
      opacity: 0.7;
      font-size: 0.9em;
    }
  `]
})
export class TimeFormatComponent {
  @Input({ required: true }) timeMs!: number | TimeDuration;

  protected readonly selectedUnit = signal<string>('auto');

  protected readonly timeUnits: TimeUnit[] = [
    { key: 's', name: 'Seconds', symbol: 's', multiplier: 0.001, description: 'Base SI unit' },
    { key: 'ms', name: 'Milliseconds', symbol: 'ms', multiplier: 1, description: 'Default precision' },
    { key: 'μs', name: 'Microseconds', symbol: 'μs', multiplier: 1000, description: 'High precision' },
    { key: 'ns', name: 'Nanoseconds', symbol: 'ns', multiplier: 1000000, description: 'Very high precision' },
    { key: 'ps', name: 'Picoseconds', symbol: 'ps', multiplier: 1000000000, description: 'Extreme precision' },
    { key: 'fs', name: 'Femtoseconds', symbol: 'fs', multiplier: 1000000000000, description: 'Theoretical precision' }
  ];

  // Helper method to convert TimeDuration to milliseconds
  private getTimeInMs(): number {
    if (typeof this.timeMs === 'number') {
      return this.timeMs;
    }
    
    // Handle TimeDuration objects or plain objects with TimeDuration structure
    const timeObj = this.timeMs as any;
    
    // Try to get milliseconds in different ways
    if (timeObj && typeof timeObj.milliseconds === 'number') {
      return timeObj.milliseconds;
    }
    
    // If it's a plain object that was serialized, it might have _nanoseconds
    if (timeObj && typeof timeObj._nanoseconds === 'number') {
      return timeObj._nanoseconds / 1_000_000; // Convert nanoseconds to milliseconds
    }
    
    // If it has nanoseconds property
    if (timeObj && typeof timeObj.nanoseconds === 'number') {
      return timeObj.nanoseconds / 1_000_000;
    }
    
    console.warn('Could not extract time value from:', timeObj);
    return 0;
  }

  protected readonly availableUnits = computed(() => {
    const timeMs = this.getTimeInMs();
    
    // Only show units that would result in reasonable values (> 0.001 and < 10000)
    return this.timeUnits.filter(unit => {
      const value = Math.abs(timeMs * unit.multiplier);
      return value >= 0.001 && value < 100000;
    });
  });

  protected formattedTime = computed((): TimeFormat => {
    const timeMs = this.getTimeInMs();
    const selectedUnit = this.selectedUnit();
    
    // Handle null/undefined/NaN
    if (timeMs === null || timeMs === undefined || isNaN(timeMs)) {
      return {
        value: "N/A",
        tooltip: "Invalid time value"
      };
    }
    
    // Handle true zero
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

    // If a specific unit is selected, use it
    if (selectedUnit !== 'auto') {
      const unit = this.timeUnits.find(u => u.key === selectedUnit);
      if (unit) {
        const value = timeMs * unit.multiplier;
        return {
          value: `${this.formatNumber(value, 3)}${unit.symbol}`,
          tooltip: `${this.formatNumber(value, 6)} ${unit.name.toLowerCase()} (click to change unit)`
        };
      }
    }

    // Auto mode - choose the best unit
    const seconds = timeMs / 1000;

    // For values >= 1 second, always show in seconds
    if (seconds >= 1) {
      const roundedSeconds = this.formatNumber(seconds, 3);
      return {
        value: `${roundedSeconds}s`,
        tooltip: `${roundedSeconds} seconds (click to change unit)`
      };
    }

    // For values >= 1 millisecond, show in milliseconds
    if (timeMs >= 1) {
      const roundedMs = this.formatNumber(timeMs, 3);
      return {
        value: `${roundedMs}ms`,
        tooltip: `${roundedMs} milliseconds (click to change unit)`
      };
    }

    // For values >= 1 microsecond (0.001ms), show in microseconds
    if (timeMs >= 0.001) {
      const microseconds = timeMs * 1000;
      const roundedUs = this.formatNumber(microseconds, 3);
      return {
        value: `${roundedUs}μs`,
        tooltip: `${roundedUs} microseconds (click to change unit)`
      };
    }

    // For values >= 1 nanosecond (0.000001ms), show in nanoseconds  
    if (timeMs >= 0.000001) {
      const nanoseconds = timeMs * 1000000;
      const roundedNs = this.formatNumber(nanoseconds, 3);
      return {
        value: `${roundedNs}ns`,
        tooltip: `${roundedNs} nanoseconds (click to change unit)`
      };
    }

    // For values >= 1 picosecond (0.000000001ms), show in picoseconds
    if (timeMs >= 0.000000001) {
      const picoseconds = timeMs * 1000000000;
      const roundedPs = this.formatNumber(picoseconds, 3);
      return {
        value: `${roundedPs}ps`,
        tooltip: `${roundedPs} picoseconds (click to change unit)`
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

  protected selectUnit(unit: string): void {
    this.selectedUnit.set(unit);
  }

  protected formatInUnit(unit: TimeUnit): string {
    const timeMs = this.getTimeInMs();
    
    if (timeMs === null || timeMs === undefined || isNaN(timeMs) || timeMs === 0) {
      return 'N/A';
    }
    
    const value = timeMs * unit.multiplier;
    return this.formatNumber(value, 3);
  }

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
