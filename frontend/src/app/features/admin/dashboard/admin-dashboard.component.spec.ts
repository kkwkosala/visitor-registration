import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { VisitRequestService } from '../../../core/services/visit-request.service';
import { VisitRequest } from '../../../core/models/visit-request.model';

const makeRequest = (overrides: Partial<VisitRequest> = {}): VisitRequest => ({
  id: 'req-1',
  user_id: 'u1',
  visitor_name: 'Alice',
  email: 'alice@example.com',
  purpose: 'Meeting',
  visit_date: '2099-12-01',
  status: 'pending',
  admin_comment: null,
  created_at: '',
  updated_at: '',
  ...overrides,
});

describe('AdminDashboardComponent', () => {
  let fixture: ComponentFixture<AdminDashboardComponent>;

  function setup(requests: VisitRequest[], error: string | null = null) {
    const mockService = {
      getAllRequests: vi.fn().mockResolvedValue({ data: requests, error }),
      updateRequestStatus: vi.fn().mockResolvedValue({ error: null }),
    };

    TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers: [
        provideRouter([]),
        { provide: VisitRequestService, useValue: mockService },
      ],
    });

    fixture = TestBed.createComponent(AdminDashboardComponent);
    return { mockService };
  }

  it('should show loading state initially', () => {
    setup([]);
    // Don't detectChanges — stay in loading state
    const comp = fixture.componentInstance;
    expect(comp['loading']()).toBe(true);
  });

  it('should render all requests after load', async () => {
    setup([makeRequest({ id: 'r1' }), makeRequest({ id: 'r2' })]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('[data-testid="request-row"]');
    expect(rows.length).toBe(2);
  });

  it('should filter requests by status', async () => {
    setup([
      makeRequest({ id: 'r1', status: 'pending' }),
      makeRequest({ id: 'r2', status: 'approved' }),
      makeRequest({ id: 'r3', status: 'rejected' }),
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // Filter to 'approved' only
    fixture.componentInstance['filterStatus'].set('approved');
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('[data-testid="request-row"]');
    expect(rows.length).toBe(1);
  });

  it('should show correct stats: total=2, pending=1, approved=1', async () => {
    setup([
      makeRequest({ id: 'r1', status: 'pending' }),
      makeRequest({ id: 'r2', status: 'approved' }),
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const comp = fixture.componentInstance;
    expect(comp['stats']().total).toBe(2);
    expect(comp['stats']().pending).toBe(1);
    expect(comp['stats']().approved).toBe(1);
    expect(comp['stats']().rejected).toBe(0);
  });

  it('should show approve/reject buttons only for pending requests', async () => {
    setup([
      makeRequest({ id: 'r1', status: 'pending' }),
      makeRequest({ id: 'r2', status: 'approved' }),
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const approveBtns = fixture.nativeElement.querySelectorAll(
      '[data-testid="approve-btn"]'
    );
    expect(approveBtns.length).toBe(1);
  });

  it('should call updateRequestStatus with approved when approve clicked', async () => {
    const { mockService } = setup([makeRequest({ id: 'req-1', status: 'pending' })]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // Open action panel and approve
    fixture.componentInstance['openAction'](fixture.componentInstance['allRequests']()[0], 'approved');
    fixture.componentInstance['actionComment'].set('Welcome!');
    fixture.detectChanges();

    await fixture.componentInstance['submitAction']();

    expect(mockService.updateRequestStatus).toHaveBeenCalledWith('req-1', {
      status: 'approved',
      admin_comment: 'Welcome!',
    });
  });

  it('should show empty state when no requests match filter', async () => {
    setup([makeRequest({ status: 'pending' })]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.componentInstance['filterStatus'].set('approved');
    fixture.detectChanges();

    const empty = fixture.nativeElement.querySelector('[data-testid="empty-state"]');
    expect(empty).toBeTruthy();
  });
});
