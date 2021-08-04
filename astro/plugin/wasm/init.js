import fs from 'fs';
import path from 'path';
import './exec.cjs';

async function init() {
  const go = new Go();
  const src = path.resolve(__dirname, './tycho.wasm');
  const buf = fs.readFileSync(src);
  const result = await WebAssembly.instantiate(new Uint8Array(buf), go.importObject);
  go.run(result.instance);
  return { BuildDocument: globalThis.BuildDocument };
}

export default init;
