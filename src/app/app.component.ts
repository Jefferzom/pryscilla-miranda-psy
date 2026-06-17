import { Component, HostListener, OnInit, afterNextRender } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { inject } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  navScrolled = false;
  mobileMenuOpen = false;

  private readonly document = inject(DOCUMENT);

  constructor() {
    afterNextRender(() => {
      this.setupScrollListener();
    });
  }

  private setupScrollListener(): void {
    this.document.defaultView?.addEventListener('scroll', () => {
      this.navScrolled = (this.document.defaultView?.scrollY ?? 0) > 20;
    });
  }

  scrollTo(event: Event, id: string): void {
    event.preventDefault();
    this.mobileMenuOpen = false;
    const el = this.document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
