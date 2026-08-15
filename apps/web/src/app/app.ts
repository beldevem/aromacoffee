import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MobileActions } from './shared/components/mobile-actions/mobile-actions';

@Component({
  selector: 'app-root',
  imports: [MobileActions, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
}
