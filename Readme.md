# LS Nexus

Aplicación web personal para llevar registro de inversiones y pagos recurrentes
(facturas, servicios, cuotas, créditos) con recordatorios de vencimiento.

MVP actual:

- Autenticación con correo/contraseña (Supabase Auth).
- CRUD de inversiones (nombre, monto, moneda, notas).
- CRUD de pagos recurrentes (nombre, monto, moneda, fecha de vencimiento, categoría).
- Dashboard con resumen y próximos vencimientos.
- Soporte multi-moneda (COP, USD, EUR).

## Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript, Tailwind CSS).
- [Supabase](https://supabase.com) (Postgres + Auth) como backend.
- Despliegue previsto en [Vercel](https://vercel.com).

## Configuración local

1. Crea un proyecto en [Supabase](https://supabase.com) y copia la **Project URL** y la **anon public key**
   desde `Project Settings → API`.
2. Copia `.env.local.example` a `.env.local` y completa esas dos variables.
3. En el SQL Editor de Supabase, ejecuta el contenido de `supabase/schema.sql` para crear las tablas
   y las políticas de seguridad (RLS).
4. Instala dependencias y levanta el proyecto:

   ```bash
   npm install
   npm run dev
   ```

5. Abre [http://localhost:3000](http://localhost:3000). Regístrate con un correo/contraseña y confirma
   el correo (Supabase envía un email de verificación por defecto).

## Despliegue

El proyecto está listo para desplegarse en Vercel: conecta el repositorio y define las mismas variables
de entorno (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) en la configuración del proyecto.

## Roadmap

- Notificaciones/recordatorios automáticos antes de cada vencimiento.
- Dashboard visual con gráficos y totales por moneda.
- Forecast financiero y fondo de emergencia.
- Integraciones futuras (calendarios, fuentes de ingresos, IA).
