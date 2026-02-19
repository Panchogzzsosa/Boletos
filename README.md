# Sistema de Gestión de Boletos

Aplicación web para administrar boletos y regalos organizados por centros y comunidades. Desarrollada con **SvelteKit**, **TypeScript** y **Supabase**.

## Características

- **Centros** — crea y gestiona múltiples centros
- **Comunidades** — cada centro puede tener varias comunidades
- **Boletos** — gestión con 3 estados: Pagado ($560 MXN) · No Pagado · Regresado
- **Regalos** — registro de regalos por comunidad
- **Dashboard** — estadísticas en tiempo real: recaudación total, por cobrar, rankings de centros y comunidades
- **Autenticación** — login por nombre de usuario con roles (admin, editor, viewer)
- **Control de acceso** — solo admins y editores pueden modificar datos

## Requisitos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com) con las tablas configuradas

## Instalación

```bash
npm install
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

## Configuración de Supabase

Las credenciales están en [src/lib/supabase.ts](src/lib/supabase.ts). Reemplaza `supabaseUrl` y `supabaseKey` con los valores de tu proyecto.

La base de datos requiere las siguientes tablas:

| Tabla | Descripción |
|-------|-------------|
| `usuarios` | Usuarios del sistema con campo `username`, `role` y `ultimo_acceso` |
| `centros` | Centros registrados |
| `comunidades` | Comunidades, relacionadas con un centro |
| `boletos` | Boletos con estado (`pagado`, `no_pagado`, `regresado`) |
| `regalos` | Regalos registrados por comunidad |

## Roles de usuario

| Rol | Puede ver | Puede editar |
|-----|-----------|--------------|
| `viewer` | Sí | No |
| `editor` | Sí | Sí |
| `admin` | Sí | Sí + gestión de usuarios |

## Precio del boleto

Configurado en `$560 pesos mexicanos`. Para cambiarlo, modifica la constante `PRECIO_BOLETO` en [src/lib/types.ts](src/lib/types.ts).

## Estructura del proyecto

```
src/
├── lib/
│   ├── auth.ts           # Autenticación y roles
│   ├── supabase.ts       # Cliente de Supabase
│   ├── stores.ts         # Estado global (Svelte stores)
│   ├── types.ts          # Tipos TypeScript
│   └── components/
│       ├── CentroCard.svelte
│       ├── ComunidadCard.svelte
│       ├── BoletoItem.svelte
│       ├── RegaloItem.svelte
│       └── Modal.svelte
└── routes/
    ├── +layout.svelte        # Layout principal
    ├── +page.svelte          # Dashboard
    ├── login/
    │   └── +page.svelte      # Inicio de sesión
    ├── centros/
    │   ├── +page.svelte      # Lista de centros
    │   └── [id]/
    │       └── +page.svelte  # Detalle del centro
    ├── comunidad/
    │   └── +page.svelte      # Vista de todas las comunidades
    └── usuarios/
        └── +page.svelte      # Gestión de usuarios (admin)
```

## Tecnologías

- [SvelteKit](https://kit.svelte.dev/) + [Svelte 5](https://svelte.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Supabase](https://supabase.com/) — base de datos y autenticación
- CSS nativo
