import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface HeroData {
  backgroundImage: string;
  altText?: string;
  title: string;
  subtitle?: string;
  highlightText?: string;
}

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.scss'],
})
export class HeroComponent {
  @Input({ required: true }) heroData!: HeroData;
}