import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimeFormatComponent } from './time-format.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TimeDuration } from '@bnch/benchmarker';
import { provideZonelessChangeDetection } from '@angular/core';

describe('TimeFormatComponent', () => {
  let component: TimeFormatComponent;
  let fixture: ComponentFixture<TimeFormatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeFormatComponent, NoopAnimationsModule],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(TimeFormatComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should format seconds correctly in auto mode', () => {
    fixture.componentRef.setInput('duration', TimeDuration.fromSeconds(5));
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('.time-format-button');
    expect(button?.textContent?.trim()).toContain('5.00s');
  });

  it('should format milliseconds correctly in auto mode', () => {
    fixture.componentRef.setInput('duration', TimeDuration.fromMilliseconds(150));
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('.time-format-button');
    expect(button?.textContent?.trim()).toContain('150ms');
  });

  it('should format microseconds correctly in auto mode', () => {
    fixture.componentRef.setInput('duration', TimeDuration.fromMilliseconds(0.1));
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('.time-format-button');
    expect(button?.textContent?.trim()).toContain('100μs');
  });

  it('should handle zero correctly', () => {
    fixture.componentRef.setInput('duration', TimeDuration.fromMilliseconds(0));
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('.time-format-button');
    expect(button?.textContent?.trim()).toContain('<1ns');
  });

  it('should handle invalid values correctly', () => {
    fixture.componentRef.setInput('duration', TimeDuration.fromNanoseconds(NaN));
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('.time-format-button');
    expect(button?.textContent?.trim()).toContain('N/A');
  });

  it('should be clickable and show dropdown icon', () => {
    fixture.componentRef.setInput('duration', TimeDuration.fromSeconds(1.5));
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('.time-format-button');
    const icon = compiled.querySelector('.dropdown-icon');
    
    expect(button).toBeTruthy();
    expect(icon).toBeTruthy();
    expect(button?.tagName.toLowerCase()).toBe('button');
  });

  it('should allow unit selection', () => {
    fixture.componentRef.setInput('duration', TimeDuration.fromSeconds(1.5));
    fixture.detectChanges();
    
    // Test selecting milliseconds unit
    component['selectUnit']('ms');
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('.time-format-button');
    expect(button?.textContent?.trim()).toContain('1500ms');
  });

  it('should calculate available units correctly', () => {
    fixture.componentRef.setInput('duration', TimeDuration.fromSeconds(1)); 
    fixture.detectChanges();
    
    const availableUnits = component['availableUnits']();
    expect(availableUnits.length).toBeGreaterThan(0);
    
    // Should include seconds and milliseconds for 1 second
    const unitKeys = availableUnits.map(u => u.key);
    expect(unitKeys).toContain('s');
    expect(unitKeys).toContain('ms');
  });
});
