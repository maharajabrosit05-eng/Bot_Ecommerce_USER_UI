import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './star-rating.component.html'
})
export class StarRatingComponent {
  @Input() rating = 0;
  @Input() reviews?: number;

  get stars(): number[] {
    return [1, 2, 3, 4, 5];
  }

  starType(star: number): 'full' | 'half' | 'empty' {
    const rounded = Math.round(this.rating * 2) / 2;
    if (star <= rounded) {
      return 'full';
    }
    if (star - 0.5 === rounded) {
      return 'half';
    }
    return 'empty';
  }
}
