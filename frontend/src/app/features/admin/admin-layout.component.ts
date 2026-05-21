import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <app-navbar />
    <main class="page-content">
      <router-outlet />
    </main>
  `,
})
export class AdminLayoutComponent {}
