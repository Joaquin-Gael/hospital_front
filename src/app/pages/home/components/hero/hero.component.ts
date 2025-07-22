import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroData } from '../../models/interfaces';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.scss']
})
export class HeroComponent {
  @Input({ required: true }) heroData!: HeroData;

  constructor() {}
}