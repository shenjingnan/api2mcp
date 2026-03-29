import { defineConfig } from 'tsup';
import { readFileSync } from 'node:fs';

// 从 package.json 读取版本号
const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    cli: 'src/cli.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  shims: true,
  external: [],
  define: {
    VERSION: JSON.stringify(pkg.version),
  },
});