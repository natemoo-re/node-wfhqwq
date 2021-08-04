import express from 'express';
import path from 'path';
import { createRequire } from 'module';
import astro from './plugin/index.js';
import { createServer as createViteServer } from 'vite';

const require = createRequire(import.meta.url);

export async function createServer() {
  const app = express();
  // Create vite server in middleware mode. This disables Vite's own HTML
  // serving logic and let the parent server take control.
  //
  // If you want to use Vite's own HTML serving logic (using Vite as
  // a development middleware), using 'html' instead.
  const vite = await createViteServer({
    server: { 
      middlewareMode: 'ssr'
    },
    configFile: false,
    root: path.resolve('src'),
    plugins: [
        astro()
    ]
  })

  app.use(async (req, res, next) => {
    const url = new URL(req.originalUrl, `http://localhost:3000`);
    if (!url.pathname.endsWith('.html') && url.pathname !== '/') {
      next();
      return;
    }

    const htmlProxy = url.searchParams.get('html-proxy') != null;
    const debug = url.searchParams.get('debug') != null;
    if (htmlProxy) {
      return;
    }
    if (debug) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/javascript')
      const result = await vite.transformRequest('src/pages/index.astro');
      if (result) {
        switch (typeof result) {
          case 'string': {
            res.end(result);
            break;
          }
          case 'object': {
            res.end(result.code);
            break;
          }
        }
      }
      return;
    }

    try {
      const { default: { __render: render }} = await vite.ssrLoadModule('src/pages/index.astro')
      let html = await render();

      // vite.transformIndexHtml();
      html = html.replace('</head>', `<script type="module" src="/@vite/client"></script><script type="module" src="@astro/hmr.js"></script></head>`)

      // 5. Inject the app-rendered HTML into the template.
      // const html = await vite.transformIndexHtml('/', appHtml, `src/pages/index.astro`)

      // 6. Send the rendered HTML back.
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html')
      res.end(html)
    } catch (e) {
      // If an error is caught, let vite fix the stracktrace so it maps back to
      // your actual source code.
      vite.ssrFixStacktrace(e)
      console.error(e)
      res.statusCode = 500;
      res.end(e.message)
    }
  })

  app.get('@astro/*', async (req, res) => {
    const url = require.resolve(req.originalUrl.slice(2));
    const transformResult = await vite.transformRequest(url);
    if (transformResult && typeof transformResult === 'object') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/javascript')
      res.end(transformResult.code)
    }
  })

  // use vite's connect instance as middleware
  app.get('*', vite.middlewares)

  app.listen(3000)
  console.log('App listening on http://localhost:3000')
}
