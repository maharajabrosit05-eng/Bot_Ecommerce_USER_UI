import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { ThemeService, AppTheme } from '../../core/services/theme.service';

@Component({
  selector: 'app-account-settings',
  standalone: true,

  imports: [
    CommonModule,
    RouterModule
  ],

  templateUrl: './account-settings.component.html',
  styleUrl: './account-settings.component.css'
})
export class AccountSettingsComponent {

  constructor(
    public router: Router,
    public themeService: ThemeService
  ) {}


  get isDark(): boolean {

    return this.themeService.isDark();

  }


  selectTheme(theme: AppTheme): void {

    this.themeService.setTheme(theme);

  }

}
