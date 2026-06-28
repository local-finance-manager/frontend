import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(viteConfig, defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',
        'src/App.tsx',
        'src/**/*.d.ts',
        'src/**/types.ts',
        'src/test/**',
        // Arquivos de teste não são código de produção
        'src/**/*.test.{ts,tsx}',
        // Componentes presentacionais (incl. gráficos/dialogs) — a lógica vive em
        // hooks/queries/lib, que SÃO cobertos. Convenção uniforme em todas as features.
        'src/components/**',
        'src/features/**/components/**',
        // Páginas finas — apenas composição de features
        'src/pages/**',
        // Hooks de "fiação" de UI (compõem componentes / dependem de DOM-router)
        'src/features/transactions/hooks/useTransactionActions.tsx',
        'src/features/transactions/hooks/useTransactionFilters.ts',
        'src/hooks/useTheme.ts',
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 85,
        statements: 85,
      },
    },
  },
}))
