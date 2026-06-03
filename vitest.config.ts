import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import swc from 'unplugin-swc';

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    swc.vite(),
  ],
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.spec.ts', '**/*.test.ts', '**/*.e2e-spec.ts', '**/*.integration-spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/apps/scout-hub/**'],
  },
});
