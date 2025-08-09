import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimeFormatComponent } from './time-format.component';

describe('TimeFormatComponent', () => {
  let component: TimeFormatComponent;
  let fixture: ComponentFixture<TimeFormatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeFormatComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TimeFormatComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should format seconds correctly', () => {
    component.timeMs = 5000; // 5 seconds
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent?.trim()).toBe('5s');
  });

  it('should format milliseconds correctly', () => {
    component.timeMs = 150; // 150 milliseconds
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent?.trim()).toBe('150ms');
  });

  it('should format microseconds correctly', () => {
    component.timeMs = 0.1; // 0.1 milliseconds = 100 microseconds
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent?.trim()).toBe('100µs');
  });

  it('should format nanoseconds correctly', () => {
    component.timeMs = 0.0005; // 0.0005 milliseconds = 500 nanoseconds
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent?.trim()).toBe('500ns');
  });

  it('should format picoseconds correctly', () => {
    component.timeMs = 0.0000005; // 0.0000005 milliseconds = 500 picoseconds
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent?.trim()).toBe('500ps');
  });

  it('should handle zero correctly', () => {
    component.timeMs = 0;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent?.trim()).toBe('0ns');
  });

  it('should handle invalid values correctly', () => {
    component.timeMs = NaN;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent?.trim()).toBe('N/A');
  });

  it('should have tooltip functionality', () => {
    component.timeMs = 1500; // 1.5 seconds
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const spanElement = compiled.querySelector('span');
    expect(spanElement?.getAttribute('mattooltip')).toContain('1.5s');
    expect(spanElement?.getAttribute('mattooltip')).toContain('1500ms');
  });
});
