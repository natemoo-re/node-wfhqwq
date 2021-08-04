import fs from 'fs';
import transformAstroToJS from './transform.js';
const fileRegex = /\.astro$/

function invalidateModule(server, moduleId) {
  const { moduleGraph } = server
  const module = moduleGraph.getModuleById('src/pages/index.astro')
  moduleGraph.invalidateModule(module);
  return null
}

const cache = new Map();

export default function astro() {
  return {
    name: '@astrojs/vite-plugin-astro',

    async handleHotUpdate({ file, modules, timestamp, server, read }) {
      invalidateModule(server, file);

      try {
        const { default: { __render: render }} = await server.ssrLoadModule('src/pages/index.astro')
        const html = await render()
        server.ws.send({
          type: 'custom',
          event: 'astro:reload',
          data: {
            html
          }
        })
      } catch (e) {
        server.ws.send({
          type: 'full-reload'
        })
      }
      return []
    },

    async load(id) {
      if (fileRegex.test(id)) {
        const code = await transformAstroToJS(fs.readFileSync(id));
        cache.set(id, code);
        return {
          code: `import 'astro/shim.js';
${code}`,
          map: null
        }
      }
    }
  }
}
