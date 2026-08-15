import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MobileActions } from './shared/components/mobile-actions/mobile-actions';
import { SeoService } from './core/seo/seo.service';

@Component({
  selector: 'app-root',
  imports: [MobileActions, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly seo = inject(SeoService);
}
