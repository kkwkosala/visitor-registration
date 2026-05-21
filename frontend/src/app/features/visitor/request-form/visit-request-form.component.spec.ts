import { TestBed, ComponentFixture } from "@angular/core/testing";
import { signal } from "@angular/core";
import { provideRouter, Router } from "@angular/router";
import { VisitRequestFormComponent } from "./visit-request-form.component";
import { VisitRequestService } from "../../../core/services/visit-request.service";
import { AuthService } from "../../../core/services/auth.service";
import { VisitRequest } from "../../../core/models/visit-request.model";

const mockRequest: VisitRequest = {
  id: "req-1",
  user_id: "user-1",
  visitor_name: "Alice",
  email: "alice@example.com",
  purpose: "Meeting",
  visit_date: "2099-12-01",
  status: "pending",
  admin_comment: null,
  created_at: "",
  updated_at: "",
};

const mockService = {
  createRequest: vi.fn().mockResolvedValue({ data: mockRequest, error: null }),
  getRequestById: vi.fn().mockResolvedValue({ data: mockRequest, error: null }),
  updateRequest: vi.fn().mockResolvedValue({ error: null }),
};

const mockAuth = {
  profile: signal({ id: "user-1", email: "visitor@test.com", role: "visitor" }),
};

describe("VisitRequestFormComponent", () => {
  let fixture: ComponentFixture<VisitRequestFormComponent>;
  let component: VisitRequestFormComponent;

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [VisitRequestFormComponent],
      providers: [
        provideRouter([]),
        { provide: VisitRequestService, useValue: mockService },
        { provide: AuthService, useValue: mockAuth },
      ],
    }).compileComponents();

    vi.spyOn(TestBed.inject(Router), "navigate").mockResolvedValue(true);

    fixture = TestBed.createComponent(VisitRequestFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create the component", () => {
    expect(component).toBeTruthy();
  });

  it("should show name required error when submitted empty", async () => {
    const btn: HTMLButtonElement =
      fixture.nativeElement.querySelector("[data-testid=submit-btn]");
    btn.click();
    fixture.detectChanges();
    const nameError = fixture.nativeElement.querySelector("[data-testid=name-error]");
    expect(nameError?.textContent?.trim()).toContain("required");
  });

  it("should reject a visit date in the past", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const pastDate = yesterday.toISOString().split("T")[0];
    component["form"].controls.visit_date.setValue(pastDate);
    component["form"].controls.visit_date.markAsTouched();
    fixture.detectChanges();
    const dateError: HTMLElement =
      fixture.nativeElement.querySelector("[data-testid=date-error]");
    expect(dateError?.textContent?.trim()).toContain("today or in the future");
  });

  it("should accept a visit date today", () => {
    const today = new Date().toISOString().split("T")[0];
    component["form"].controls.visit_date.setValue(today);
    component["form"].controls.visit_date.markAsTouched();
    fixture.detectChanges();
    expect(component["form"].controls.visit_date.valid).toBe(true);
  });

  it("should reject email without @ sign", () => {
    component["form"].controls.email.setValue("notanemail");
    component["form"].controls.email.markAsTouched();
    fixture.detectChanges();
    const emailError: HTMLElement =
      fixture.nativeElement.querySelector("[data-testid=email-error]");
    expect(emailError?.textContent?.trim()).toContain("valid email");
  });

  it("should call createRequest with form data on valid submit", async () => {
    const futureDate = "2099-12-01";
    component["form"].setValue({
      visitor_name: "Alice",
      email: "alice@example.com",
      purpose: "Interview",
      visit_date: futureDate,
    });
    await component.onSubmit();
    expect(mockService.createRequest).toHaveBeenCalledWith({
      visitor_name: "Alice",
      email: "alice@example.com",
      purpose: "Interview",
      visit_date: futureDate,
    });
  });

  it("should show error message when createRequest fails", async () => {
    mockService.createRequest.mockResolvedValue({ data: null, error: "Database error" });
    component["form"].setValue({
      visitor_name: "Alice",
      email: "alice@example.com",
      purpose: "Meeting",
      visit_date: "2099-12-01",
    });
    await component.onSubmit();
    fixture.detectChanges();
    const alert: HTMLElement =
      fixture.nativeElement.querySelector("[data-testid=error-alert]");
    expect(alert?.textContent?.trim()).toContain("Database error");
  });
});
