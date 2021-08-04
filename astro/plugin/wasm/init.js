import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import './exec.cjs';

async function init() {
  const go = new Go();
  const src = fileURLToPath(new URL('./tycho.wasm', import.meta.url));
  const buf = readFileSync(src);
  console.log(buf);
  const result = await WebAssembly.instantiate(
    new Uint8Array(buf),
    go.importObject
  );
  go.run(result.instance);
  return { BuildDocument: globalThis.BuildDocument };
}

export default init;
