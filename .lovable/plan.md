## Objetivo

Pulir el sistema de accesos con **6 roles operativos**, **permisos por módulo** (ver/crear/editar/eliminar/aprobar), **aislamiento por sucursal** y permitir que **admin y manager** gestionen usuarios.

## Roles definidos

| Rol | Alcance por defecto |
|---|---|
| `admin` | Todo el sistema, todas las sucursales, gestiona usuarios y roles |
| `manager` | Finanzas, RRHH, compras, reportes de sus sucursales; asigna roles no-admin |
| `editor` | CMS de contenido (blog, hero, servicios, testimonios, medios) |
| `operator` | OTs, inspecciones, checklists, fotos, incidencias de su sucursal |
| `supplier` | Portal proveedor (RFQs, subastas, evaluaciones propias) |
| `client` | Portal cliente (mis reservas, facturas, documentos, contratos) |

`user` se mantiene como rol base sin privilegios (registro público).

## Cambios de base de datos

1. **Enum `app_role`** — agregar `manager`, `operator`, `supplier`, `client`.
2. **Tabla `role_permissions`** — matriz configurable:
   `role, module, can_view, can_create, can_edit, can_delete, can_approve`.
   Se siembra con la matriz por defecto de la tabla de abajo.
3. **Funciones helper (SECURITY DEFINER)**:
   - `has_permission(_user_id, _module, _action)` → consulta `role_permissions`.
   - `has_branch_access(_user_id, _branch_id)` → admin=true; resto valida `user_branches`.
   - `get_user_branches(_user_id)` → array de sucursales asignadas.
4. **RLS**: se actualizan las políticas de los módulos principales (work_orders, invoices, purchase_orders, contracts, documents, contact_messages, employees) para combinar `has_permission` + `has_branch_access(auth.uid(), branch_id)`. Módulos de contenido (blog, hero, services…) usan solo `has_permission`.

## Matriz de permisos por defecto (semilla)

```text
Módulo           admin  manager  editor  operator  supplier  client
contenido_cms    CRUD   R        CRUD    -         -         -
usuarios         CRUD   RU*      -       -         -         -
sucursales       CRUD   R        -       -         -         -
work_orders      CRUD   CRUD     -       RU        -         R(prop)
inspecciones     CRUD   R        -       CRU       -         -
facturas         CRUD   CRU      -       -         -         R(prop)
compras          CRUD   CRUD     -       R         -         -
rfqs             CRUD   CRU      -       -         RU(prop)  -
proveedores      CRUD   CRU      -       -         RU(prop)  -
contratos        CRUD   CRU      -       -         -         RU(prop)
documentos       CRUD   CRU      -       R         -         R(prop)
rrhh             CRUD   CRU      -       -         -         -
reportes/BI      R      R        -       -         -         -
portal_cliente   -      -        -       -         -         CRUD(prop)

RU* = manager solo asigna roles no-admin
(prop) = solo registros propios
```

Esta matriz vive en `role_permissions` y es editable en el CMS.

## Cambios de frontend

- **`src/hooks/useAuth.tsx`** — carga permisos y sucursales del usuario; expone `can(module, action)`, `branchIds`, `isManager`, `isOperator`, `isSupplier`, `isClient`.
- **`src/hooks/useBranch.tsx`** — filtra sucursales visibles según `branchIds`.
- **`src/pages/Admin.tsx`** — cada ítem del sidebar se filtra con `can(module, 'view')`.
- **`src/components/admin/AdminUsers.tsx`** — visible para admin y manager; manager no puede crear/editar admins; agrega selector multi-sucursal al crear/editar usuario.
- **`src/components/admin/AdminRolesPermissions.tsx`** (nuevo) — matriz visual editable de `role_permissions` (solo admin).
- **`src/pages/AdminLogin.tsx`** — al iniciar sesión, redirige por rol: `client` → `/mi-cuenta`, `supplier` → `/proveedor`, resto → `/admin`.

## Cambios de Edge Function

- **`supabase/functions/manage-users/index.ts`**:
  - Acepta llamadas de admin **o manager**.
  - Manager: no puede crear/editar/eliminar usuarios con rol `admin` (rechaza con 403).
  - Nuevo campo `branch_ids: uuid[]` en create/update → sincroniza `user_branches`.

## Detalles técnicos

- Compatibilidad: `has_role` sigue funcionando; las políticas existentes siguen válidas. Las nuevas políticas se agregan **junto** a las existentes con `OR`, no las reemplazan de golpe, para evitar romper flujos.
- Migración de datos: usuarios actuales con rol `user` mantienen su rol; no se auto-promueven.
- Seguridad: `role_permissions` es solo-lectura para `authenticated`; solo `admin` puede escribir vía RLS.

## Fuera de alcance (para próxima iteración si lo pides)

- Reescribir RLS de las ~100 tablas — se hará en olas por módulo si quieres precisión total; por ahora se cubren los módulos críticos listados arriba.
- Auditoría automática de cambios de rol (ya existe `audit_log`, se puede enganchar después).

Al aprobar, aplico la migración, actualizo Edge Function, hook `useAuth`, `AdminUsers` y creo `AdminRolesPermissions`.
