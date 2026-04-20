import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-epargne-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './epargne-section.component.html',
  styleUrls: ['./epargne-section.component.css']
})
export class EpargneSectionComponent implements AfterViewInit {
  @ViewChild('epargneVideo') epargneVideo!: ElementRef<HTMLVideoElement>;

  ngAfterViewInit(): void {
    const video = this.epargneVideo.nativeElement;
    if (video) {
        video.muted = true;
        video.play().catch(e => console.warn('Epargne video autoplay failed:', e));
    }
  }
}
