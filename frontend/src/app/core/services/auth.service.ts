import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Session } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { Profile } from '../models/profile.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly router = inject(Router);

  private readonly _session = signal<Session | null>(null);
  private readonly _profile = signal<Profile | null>(null);
  private readonly _loading = signal(true);

  readonly session = this._session.asReadonly();
  readonly profile = this._profile.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly isAuthenticated = computed(() => this._session() !== null);
  readonly role = computed(() => this._profile()?.role ?? null);
  readonly isAdmin = computed(() => this._profile()?.role === 'admin');

  constructor() {
    this.supabase.auth.getSession().then(({ data }) => {
      this._session.set(data.session);
      if (data.session) {
        this.loadProfile(data.session.user.id).finally(() =>
          this._loading.set(false)
        );
      } else {
        this._loading.set(false);
      }
    });

    this.supabase.auth.onAuthStateChange((event, session) => {
      this._session.set(session);
      if (session) {
        this.loadProfile(session.user.id);
      } else {
        this._profile.set(null);
      }
    });
  }

  async signIn(email: string, password: string): Promise<{ error: string | null }> {
    const { error } = await this.supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async signUp(email: string, password: string): Promise<{ error: string | null }> {
    const { error } = await this.supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
    this._session.set(null);
    this._profile.set(null);
    this.router.navigate(['/login']);
  }

  private async loadProfile(userId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      this._profile.set(data as Profile);
    }
  }
}
