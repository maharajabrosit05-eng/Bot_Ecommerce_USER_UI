import { Injectable } from '@angular/core';

export type AppTheme = 'light' | 'dark';

const STORAGE_KEY = 'app_theme';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  private currentTheme: AppTheme = 'light';

  constructor() {

    const stored = (localStorage.getItem(STORAGE_KEY) as AppTheme | null);

    this.applyTheme(stored === 'dark' ? 'dark' : 'light');

  }


  get theme(): AppTheme {

    return this.currentTheme;

  }


  isDark(): boolean {

    return this.currentTheme === 'dark';

  }


  setTheme(theme: AppTheme): void {

    this.applyTheme(theme);

    localStorage.setItem(STORAGE_KEY, theme);

  }


  toggleTheme(): void {

    this.setTheme(this.currentTheme === 'dark' ? 'light' : 'dark');

  }


  private applyTheme(theme: AppTheme): void {

    this.currentTheme = theme;

    document.documentElement.setAttribute('data-theme', theme);

  }

}
