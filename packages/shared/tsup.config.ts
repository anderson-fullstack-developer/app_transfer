import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'password/index': 'src/password/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  tsconfig: 'tsconfig.build.json',
  sourcemap: true,
  clean: true,
  treeshake: true,
});
