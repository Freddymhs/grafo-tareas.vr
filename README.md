# grafo-tareas.vr

El grafo de tareas de `grafo-tareas` alrededor de uno, en el Meta Quest 3S (WebXR). Nació de
`Freddymhs/template-react-vite`; el plan vive en el orquestador: `../docs/_CONCEPTO.md` y
`../docs/backlog/FASE_1_PRUEBA_VISOR.md`.

**Estado (2026-10-17):** FASE 1 ✅ (500 nodos sintéticos a 72 FPS: React Three Fiber + `@react-three/xr` + drei,
layout `d3-force-3d` en un Web Worker). FASE 6 ✅: el grafo real de la API, con las posiciones guardadas y el bloqueo
que responde la API. FASE 7 ✅: cerrar un nodo y ver qué libera, y conectar apuntando con el rayo del control.

## Probar

```bash
npm run dev                              # PC: http://localhost:5173 — sin visor, el emulador IWER hace de Quest (src/lib/emulador.ts)
../bin/probar-en-visor --api --abrir     # visor, el grafo REAL: build + preview + adb reverse (VR y API) + abre el Quest Browser
../bin/probar-en-visor --abrir           # visor, la prueba de la FASE 1: 500 nodos sintéticos (lo que se MIDE)
../bin/probar-en-visor --dev             # visor con recarga en caliente (para iterar, no para medir)
npm run api:generar                      # regenera el cliente desde ../grafo-tareas.api/openapi.json (Orval)
```

WebXR exige contexto seguro: `adb reverse` deja el servidor del PC en el `localhost` del Quest, sin certificados.
Sin query la escena lee la API (`VITE_API_URL`, default `http://localhost:3000`); `?nodos=` (30 a 2000) o
`?sintetico` usan el generador de la FASE 1 y `?semilla=` lo cambia. El medidor de FPS va pegado a la vista
(abajo a la izquierda): verde ≥ 72, rojo por debajo.
`?espacio=` y `?proyecto=` (FASE 24) abren esa pestaña; sin ellos manda la última vista, y la barra de alcance cambia de
espacio o proyecto dentro del visor. Lo conectado desde otro proyecto entra como fantasma y no guarda posición.

**Con la API (FASE 6 y 7):** la primera vez el layout de fuerzas reparte los nodos y guarda las posiciones en la
API; después el mapa es siempre el mismo y cada nodo nuevo cae junto a sus vecinos. Gatillo sobre un nodo = su
título, qué lo bloquea (lo responde la API) y el panel: **Cerrar** (y en verde lo que se libera) o **Este depende
de… / bloqueada por… / espera respuesta de…** y gatillo sobre el otro nodo para conectarlos.

**Una sola copia de `three`** (`overrides` en `package.json`): `@iwer/devui` traía la 0.165 y en VR emulado cada
frame fallaba con `material.onBuild is not a function` (pantalla negra).

| carpeta       | qué hay                                                                                                                                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/`    | dominio, cliente de la API (`api/`, generado por Orval), `desde-api.ts`, `ubicar.ts` (posiciones nuevas), `estado-vr.ts` (Zustand), `texto-visible.ts`, generador sintético, layout (`layout.ts` + `layout.worker.ts`), colores |
| `src/escena/` | `Grafo` (compone), `Nodos` (instanciados, 1 draw call), `Aristas` (1 geometría por capa), `Etiquetas` (solo las cercanas), `Seleccion`, `PanelAcciones` + `Boton3D`, `Medidor`, `useMapaApi`, `useAccionesVr`                   |

## Stack

| Capa             | Tecnologia                            | Notas                                                                             |
| ---------------- | ------------------------------------- | --------------------------------------------------------------------------------- |
| Base             | Vite + React 19 + TypeScript (strict) | `tsc -b` con project references (`tsconfig.app.json` / `tsconfig.node.json`)      |
| Estilos          | Tailwind CSS v4 (`@tailwindcss/vite`) | Sin config file — Tailwind v4 usa CSS-first config, ver `src/index.css`           |
| PWA              | `vite-plugin-pwa` (Workbox)           | `registerType: 'autoUpdate'`, app-shell offline, manifest de ejemplo              |
| Testing unitario | Vitest + Testing Library + jsdom      | `src/App.test.tsx` de ejemplo                                                     |
| Testing E2E      | Playwright                            | `e2e/home.spec.ts` — smoke que carga la home                                      |
| Lint / format    | ESLint flat config + Prettier         | `eslint.config.mjs`, `.prettierrc`                                                |
| Git hooks        | Husky + lint-staged + commitlint      | pre-commit corre lint+format sobre staged, commit-msg valida conventional commits |
| CI               | GitHub Actions                        | `.github/workflows/ci.yml`                                                        |

### Por que Tailwind v4

Se uso Tailwind v4 (`4.3.2` al momento de crear este template) en vez de v3: el setup es estable,
elimina `tailwind.config.js` y `postcss.config.js` (configuracion CSS-first via `@import
'tailwindcss'` en `src/index.css` + plugin `@tailwindcss/vite`), y el build/tests corrieron sin
problemas en la verificacion de este template. Si tu proyecto depende de un plugin de Tailwind que
todavia no soporta v4, bajar a v3 estable es la alternativa documentada.

## Como usar

```bash
git clone https://github.com/Freddymhs/template-react-vite.git mi-proyecto
cd mi-proyecto
rm -rf .git && git init   # arrancar historia propia
npm install
npm run dev
```

### Scripts

| Script                 | Que hace                                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run dev`          | Servidor de desarrollo con HMR                                                                                                       |
| `npm run build`        | Type-check (`tsc -b`) + build de produccion (`dist/`)                                                                                |
| `npm run preview`      | Sirve el build de produccion localmente                                                                                              |
| `npm run lint`         | ESLint sobre todo el proyecto                                                                                                        |
| `npm run lint:fix`     | ESLint con `--fix`                                                                                                                   |
| `npm run format`       | Prettier `--write` sobre todo el proyecto                                                                                            |
| `npm run format:check` | Prettier `--check` (usado en CI)                                                                                                     |
| `npm run type-check`   | `tsc -b` sin build de Vite                                                                                                           |
| `npm run test`         | Vitest en modo watch                                                                                                                 |
| `npm run test:run`     | Vitest una sola pasada (usado en CI)                                                                                                 |
| `npm run test:e2e`     | Playwright — requiere `npx playwright install --with-deps chromium` la primera vez (o el Chrome del sistema con `channel: 'chrome'`) |
| `npm run prepare`      | Instala los hooks de Husky (se corre solo en `npm install`)                                                                          |

## Que agregar por proyecto

Ya agregadas en este proyecto: **TanStack Query** + **Orval** (el cliente de la API, FASE 6) y **Zustand** (el estado
de la escena, FASE 7).

Este template es intencionalmente lean. Las siguientes librerias **no** vienen instaladas — se
agregan segun lo que el proyecto concreto necesite:

- **Dexie** — si el proyecto necesita persistencia local con IndexedDB (offline-first real, no solo cache de assets).
- **Recharts** — si el proyecto muestra graficos/dashboards.
- **react-hook-form** — si hay formularios con validacion compleja.
- **Zod** — si necesitas validar schemas en runtime (forms, respuestas de API, `localStorage`).
- **date-fns** — si hay manejo de fechas mas alla de lo nativo (`Intl.DateTimeFormat`, `Date`).

No se agregan preventivamente: cada dependencia nueva es superficie de mantenimiento que este
template no asume por vos.

## Estructura

```
src/
  main.tsx          # entry point
  App.tsx            # home de ejemplo + estado del service worker (PWA)
  App.test.tsx        # test Vitest + Testing Library de ejemplo
  index.css           # Tailwind directives
  lib/                # logica de dominio del proyecto (vacio por diseno)
  test/setup.ts        # matchers de jest-dom para Vitest
e2e/
  home.spec.ts         # smoke test Playwright (carga la home)
.github/workflows/
  ci.yml                # type-check -> lint -> test -> build (+ e2e en job separado)
```

## CI

El workflow corre dos jobs:

1. **quality** — type-check, lint, format check, unit tests y build. Rapido, corre siempre.
2. **e2e** — instala Chromium y corre el smoke test de Playwright. Depende de `quality` (`needs:
quality`) para no gastar minutos de CI en un job mas lento si lo basico ya rompio. Sube el
   reporte de Playwright como artifact si falla.

## Node

Version fijada en `.nvmrc` (Node 22 LTS). Si usas `nvm`, `nvm use` la toma automaticamente.
