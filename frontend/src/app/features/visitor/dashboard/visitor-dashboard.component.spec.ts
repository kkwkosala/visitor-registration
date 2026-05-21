import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { VisitorDashboardComponent } from './visitor-dashboard.component';
import { VisitRequestService } from '../../../core/services/visit-request.service';
import { VisitRequest } from '../../../core/models/visit-request.model';

const makeRequest = (overrides: Partial<VisitRequest> = {}): VisitRequest => ({
  id: 'req-1',
  user_id: 'user-1',
  visitor_name: 'Alice',
  email: 'alice@example.com',
  purpose: 'Meeting',
  visit_date: '2099-12-01',
  status: 'pending',
  admin_comment: null,
  created_at: '2099-11-01T10:00:00Z',
  updated_at: '2099-11-01T10:00:00Z',
  ...overrides,
});

describe('VisitorDashboardComponent', () => {
  let fixture: ComponentFixture<VisitorDashboardComponent>;

  function setup(requests: VisitRequest[], error: string | null = null) {
    const mockService = {
      getOwnRequests: vi.fn().mockResolvedValue({ data: requests, error }),
      deleteRequest: vi.fn().mockResolvedValue({ error: null }),
    };

    TestBed.configureTestingModule({
      imports: [VisitorDashboardComponent],
      providers: [
        provideRouter([]),
        { provide: VisitRequestService, useValue: mockService },
      ],
    });

    fixture = TestBed.createComponent(VisitorDashboardComponent);
  }

  it('should show loading state initially', () => {
    // Service returns a never-resolving promise to keep loading state
    const mockService = {
      getOwnRequests: vi.fn().mockReturnValue(new Promise(() => {})),
      deleteRequest: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [VisitorDashboardComponent],
      providers: [
        provideRouter([]),
        { provide: VisitRequestService, useValue: mockService },
      ],
    });
    fixture = TestBed.createComponent(VisitorDashboardComponent);
    fixture.detectChanges();

    const spinner = fixture.nativeElement.querySelector('.spinner');
    expect(spinner).toBeTruthy();
  });

  it('should show empty state when no requests', async () => {
    setup([]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const empty: HTMLElement = fixture.nativeElement.querySelector(
      '[data-testid="empty-state"]'
    );
    expect(empty).toBeTruthy();
  });

  it('should render one row per request', async () => {
    setup([makeRequest({ id: 'r1' }), makeRequest({ id: 'r2' })]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('[data-testid="request-row"]');
    expect(rows.length).toBe(2);
  });

  it('should show Edit link only for pending requests', async () => {
    setup([
      makeRequest({ id: 'r1', status: 'pending' }),
      makeRequest({ id: 'r2', status: 'approved' }),
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const editLinks = fixture.nativeElement.querySelectorAll('[data-testid="edit-link"]');
    expect(editLinks.length).toBe(1);
  });

  it('should show error state when service fails', async () => {
    setup([], 'Failed to load');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const errorEl: HTMLElement = fixture.nativeElement.querySelector(
      '[data-testid="error-state"]'
    );
    expect(errorEl?.textContent?.trim()).toContain('Failed to load');
  });
});
