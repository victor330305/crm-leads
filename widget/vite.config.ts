import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry:    'src/widget.ts',
      name:     'CRMWidget',
      fileName: 'crm-widget',
      formats:  ['iife'], // Un solo archivo JS que se puede incluir con <script>
    },
    rollupOptions: {
      output: {
        // Sin imports externos — todo en un solo archivo
        inlineDynamicImports: true,
      },
    },
    outDir: 'dist',
    minify: true,
  },
  // Servidor de dev para probar el widget en una página HTML
  root: '.',
  server: { port: 5174 },
});
