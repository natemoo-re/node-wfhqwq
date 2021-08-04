import init from './wasm/init.js';

export default async function transformAstro(source, filename) {
    const Tycho = await init();
    return Tycho.BuildDocument(source.toString());
}
