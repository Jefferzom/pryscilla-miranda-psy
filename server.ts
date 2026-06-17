import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';

const isProd = process.env['NODE_ENV'] === 'production';

export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');

  // ── Security headers ──────────────────────────────────────────────
  server.use(
    helmet({
      // Prevent the site from being embedded in iframes (clickjacking)
      frameguard: { action: 'deny' },

      // Prevent MIME-type sniffing
      noSniff: true,

      // Force HTTPS in production (1 year, include subdomains)
      hsts: isProd
        ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
        : false,

      // Referrer policy — send origin only to same-origin requests
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

      // Hide "X-Powered-By: Express"
      hidePoweredBy: true,

      // Content-Security-Policy
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            // Vite HMR in dev
            ...(isProd ? [] : ["'unsafe-inline'", "'unsafe-eval'"]),
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'", // Tailwind inline styles + Angular
            'https://fonts.googleapis.com',
          ],
          fontSrc: [
            "'self'",
            'https://fonts.gstatic.com',
            'https://fonts.googleapis.com',
          ],
          imgSrc: [
            "'self'",
            'data:',
            'https://lh3.googleusercontent.com', // placeholder images
          ],
          connectSrc: ["'self'"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'", 'https://wa.me'], // contact form + WhatsApp
          upgradeInsecureRequests: isProd ? [] : null,
        },
      },

      // XSS filter for older browsers
      xssFilter: true,
    })
  );

  // Permissions-Policy — disable APIs not used by the site
  server.use((_req, res, next) => {
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
    );
    next();
  });

  // ── Rate limiting ──────────────────────────────────────────────────
  // General: max 120 requests per IP per minute
  server.use(
    rateLimit({
      windowMs: 60_000,
      max: 120,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Muitas requisições. Tente novamente em breve.' },
    })
  );

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // Serve static files with long-lived cache (hashed filenames) + security
  server.get(
    '**',
    express.static(browserDistFolder, {
      maxAge: '1y',
      index: 'index.html',
      setHeaders(res) {
        // robots.txt and sitemap should not be cached aggressively
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      },
    })
  );

  // All regular routes use the Angular SSR engine
  server.get('**', (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;

    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      })
      .then((html) => res.send(html))
      .catch((err) => next(err));
  });

  return server;
}

const commonEngine = new CommonEngine();

function run(): void {
  const port = process.env['PORT'] || 4000;

  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
