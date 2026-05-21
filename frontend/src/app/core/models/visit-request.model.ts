export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface VisitRequest {
  id: string;
  user_id: string;
  visitor_name: string;
  email: string;
  purpose: string;
  visit_date: string; // ISO date string: YYYY-MM-DD
  status: RequestStatus;
  admin_comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateVisitRequestDto {
  visitor_name: string;
  email: string;
  purpose: string;
  visit_date: string;
}

export interface UpdateVisitRequestDto {
  visitor_name?: string;
  email?: string;
  purpose?: string;
  visit_date?: string;
}

export interface UpdateRequestStatusDto {
  status: RequestStatus;
  admin_comment?: string;
}
