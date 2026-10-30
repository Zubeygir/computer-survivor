import { fileURLToPath } from 'node:url';

const here = (path) => fileURLToPath(new URL(path, import.meta.url));

// Bundles the real game code for plain node, with Phaser swapped for a stub
export default {
  publicDir: false,
  resolve: { alias: { phaser: here('phaser-stub.js') } },
  ssr: { noExternal: true },
  build: {
    ssr: here('report.js'),
    outDir: here('out'),
    emptyOutDir: true,
    minify: false,
  },
};
