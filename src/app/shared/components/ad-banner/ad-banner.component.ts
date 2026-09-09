import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';

import { CommonService } from '../../../../service/common.service';
import { environment } from '../../../../environments/environment';

// =========================================================
// ⭐ AD BANNER — reusable Advertisement slot, same look/feel
// as the ad slots on the Home page (auto-rotating slider +
// dots), just packaged as a drop-in component so any page
// can show a slot by Slot_No without repeating the whole
// slider markup/logic again.
//
// Usage:  <app-ad-banner [slotNo]="6"></app-ad-banner>
//
// Renders nothing at all when the slot has no active ads —
// no empty placeholder box on these pages (unlike Home).
// =========================================================

@Component({
  selector: 'app-ad-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ad-banner.component.html',
  styleUrl: './ad-banner.component.scss'
})
export class AdBannerComponent implements OnInit, OnChanges, OnDestroy {

  // Which M_ADVERTISEMENT Slot_No (1-8) this instance shows.
  @Input({ required: true }) slotNo!: number;

  ads: any[] = [];

  activeIndex = 0;

  adImageError: { [code: string]: boolean } = {};

  private timer: any;

  private readonly apiImageBaseUrl = environment.apiUrl;

  constructor(private service: CommonService) { }

  ngOnInit(): void {
    this.loadAds();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['slotNo'] && !changes['slotNo'].firstChange) {
      this.loadAds();
    }
  }

  ngOnDestroy(): void {
    this.stopSlider();
  }

  private loadAds(): void {

    if (!this.slotNo) {
      return;
    }

    this.service.GetAdvertisementListBySlot(this.slotNo).subscribe({

      next: (res: any) => {

        this.ads = (res?.status === true && Array.isArray(res?.data)) ? res.data : [];

        this.activeIndex = 0;
        this.adImageError = {};

        this.startSlider();
      },

      error: (error: any) => {
        console.error(`AD BANNER — GET ADVERTISEMENT (Slot ${this.slotNo}) API ERROR:`, error);
        this.ads = [];
      }

    });

  }

  getAdImage(ad: any): string {
    return this.normalizeImageUrl(ad?.Image_Url);
  }

  getAdKey(ad: any): string {
    return String(ad?.Advertisement_Code ?? '');
  }

  onAdImageError(ad: any): void {

    const key = this.getAdKey(ad);

    this.adImageError = {
      ...this.adImageError,
      [key]: true
    };
  }

  goToAdSlide(index: number): void {
    this.activeIndex = index;
  }

  private startSlider(): void {

    this.stopSlider();

    if (this.ads.length > 1) {

      this.timer = setInterval(() => {

        if (this.ads.length > 0) {
          this.activeIndex = (this.activeIndex + 1) % this.ads.length;
        }

      }, 4000);

    }

  }

  private stopSlider(): void {

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

  }

  private normalizeImageUrl(value: any): string {

    const raw = String(value ?? '').trim();

    if (!raw) {
      return '';
    }

    if (/^(https?:)?\/\//i.test(raw) || raw.startsWith('data:') || raw.startsWith('blob:')) {
      return raw;
    }

    const cleanPath = raw.startsWith('/') ? raw : `/${raw}`;

    return `${this.apiImageBaseUrl}${cleanPath}`;
  }

}
