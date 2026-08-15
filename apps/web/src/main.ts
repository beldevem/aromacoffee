import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

inject();
injectSpeedInsights();

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
