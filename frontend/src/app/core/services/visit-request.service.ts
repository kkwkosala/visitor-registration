import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import {
  VisitRequest,
  CreateVisitRequestDto,
  UpdateVisitRequestDto,
  UpdateRequestStatusDto,
} from '../models/visit-request.model';

@Injectable({ providedIn: 'root' })
export class VisitRequestService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly auth = inject(AuthService);

  async createRequest(
    dto: CreateVisitRequestDto
  ): Promise<{ data: VisitRequest | null; error: string | null }> {
    const userId = this.auth.session()?.user.id;
    if (!userId) return { data: null, error: 'Not authenticated' };

    const { data, error } = await this.supabase
      .from('visit_requests')
      .insert({ ...dto, user_id: userId })
      .select()
      .single();

    return { data: data as VisitRequest | null, error: error?.message ?? null };
  }

  async getOwnRequests(): Promise<{
    data: VisitRequest[];
    error: string | null;
  }> {
    const { data, error } = await this.supabase
      .from('visit_requests')
      .select('*')
      .order('created_at', { ascending: false });

    return { data: (data as VisitRequest[]) ?? [], error: error?.message ?? null };
  }

  async getRequestById(id: string): Promise<{
    data: VisitRequest | null;
    error: string | null;
  }> {
    const { data, error } = await this.supabase
      .from('visit_requests')
      .select('*')
      .eq('id', id)
      .single();

    return { data: data as VisitRequest | null, error: error?.message ?? null };
  }

  async updateRequest(
    id: string,
    dto: UpdateVisitRequestDto
  ): Promise<{ error: string | null }> {
    const { error } = await this.supabase
      .from('visit_requests')
      .update(dto)
      .eq('id', id);

    return { error: error?.message ?? null };
  }

  async deleteRequest(id: string): Promise<{ error: string | null }> {
    const { error } = await this.supabase
      .from('visit_requests')
      .delete()
      .eq('id', id);

    return { error: error?.message ?? null };
  }

  // Admin-only: fetch all requests from all users
  async getAllRequests(): Promise<{
    data: VisitRequest[];
    error: string | null;
  }> {
    const { data, error } = await this.supabase
      .from('visit_requests')
      .select('*')
      .order('created_at', { ascending: false });

    return { data: (data as VisitRequest[]) ?? [], error: error?.message ?? null };
  }

  // Admin-only: update status + comment
  async updateRequestStatus(
    id: string,
    dto: UpdateRequestStatusDto
  ): Promise<{ error: string | null }> {
    const { error } = await this.supabase
      .from('visit_requests')
      .update({
        status: dto.status,
        admin_comment: dto.admin_comment ?? null,
      })
      .eq('id', id);

    // Structured log for observability (replace console with log shipper in production)
    console.log(
      JSON.stringify({
        event: 'visit_request_status_changed',
        request_id: id,
        new_status: dto.status,
        timestamp: new Date().toISOString(),
      })
    );

    return { error: error?.message ?? null };
  }
}
