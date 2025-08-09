import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimeFormatComponent } from './time-format.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('TimeFormatComponent', () => {
  let component: TimeFormatComponent;
  let fixture: ComponentFixture<TimeFormatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeFormatComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(TimeFormatComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should format seconds correctly in auto mode', () => {
    component.timeMs = 5000; // 5 seconds
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('.time-format-button');
    expect(button?.textContent?.trim()).toContain('5s');
  });

  it('should format milliseconds correctly in auto mode', () => {
    component.timeMs = 150; // 150 milliseconds
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('.time-format-button');
    expect(button?.textContent?.trim()).toContain('150ms');
  });

  it('should format microseconds correctly in auto mode', () => {
    component.timeMs = 0.1; // 0.1 milliseconds = 100 microseconds
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('.time-format-button');
    expect(button?.textContent?.trim()).toContain('100μs');
  });

  it('should handle zero correctly', () => {
    component.timeMs = 0;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('.time-format-button');
    expect(button?.textContent?.trim()).toContain('<1ns');
  });

  it('should handle invalid values correctly', () => {
    component.timeMs = NaN;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('.time-format-button');
    expect(button?.textContent?.trim()).toContain('N/A');
  });

  it('should be clickable and show dropdown icon', () => {
    component.timeMs = 1500; // 1.5 seconds
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('.time-format-button');
    const icon = compiled.querySelector('.dropdown-icon');
    
    expect(button).toBeTruthy();
    expect(icon).toBeTruthy();
    expect(button?.tagName.toLowerCase()).toBe('button');
  });

  it('should allow unit selection', () => {
    component.timeMs = 1500; // 1.5 seconds
    fixture.detectChanges();
    
    // Test selecting milliseconds unit
    component['selectUnit']('ms');
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('.time-format-button');
    expect(button?.textContent?.trim()).toContain('1500ms');
  });

  it('should calculate available units correctly', () => {
    component.timeMs = 1000; // 1 second
    fixture.detectChanges();
    
    const availableUnits = component['availableUnits']();
    expect(availableUnits.length).toBeGreaterThan(0);
    
    // Should include seconds and milliseconds for 1 second
    const unitKeys = availableUnits.map(u => u.key);
    expect(unitKeys).toContain('s');
    expect(unitKeys).toContain('ms');
  });
});
