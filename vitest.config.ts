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
        // Primitivos UI e componentes presentacionais sem lógica de negócio
        'src/components/ui/**',
        'src/components/Layout.tsx',
        'src/components/Sidebar.tsx',
        // Página fina — apenas composição de features
        'src/pages/**',
        // Componentes presentacionais — lógica está nos hooks/queries
        'src/features/categories/components/**',
        'src/features/transactions/components/**',
        // Hook de URL params — depende de react-router useSearchParams
        'src/features/transactions/hooks/useTransactionFilters.ts',
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
