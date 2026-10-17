import { defineConfig } from 'orval'

// El contrato es el openapi.json versionado de la API (concepto § Stack, Contrato), el mismo que usa la web:
// de ahí salen los tipos y los hooks de TanStack Query. Lo derivado (bloqueado, libera) vive en la API; acá
// solo se consume (C1). `npm run api:generar` lo regenera.
export default defineConfig({
  grafo: {
    input: { target: '../grafo-tareas.api/openapi.json' },
    output: {
      target: 'src/lib/api/generado/grafo.ts',
      schemas: 'src/lib/api/generado/modelos',
      client: 'react-query',
      httpClient: 'fetch',
      mode: 'tags-split',
      clean: true,
      override: {
        mutator: { path: 'src/lib/api/cliente.ts', name: 'cliente' },
        // El mutator ya devuelve el `data` desenvuelto: sin esto Orval tipa cada respuesta como { data, status, headers }.
        fetch: { includeHttpResponseReturnType: false },
      },
    },
  },
})
