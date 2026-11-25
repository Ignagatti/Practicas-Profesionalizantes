# AcuApp

### Sistema de Gestión Administrativa para Fábrica de Sillas y Sillones

**Proyecto final · Tecnicatura Superior en Desarrollo de Software**  
**ITEC El Molino · Esperanza, Santa Fe, Argentina · 2026**

Desarrollamos **AcuApp** como proyecto final de nuestra carrera, tomando como referencia los procesos administrativos de **Acuaber**, una fábrica de sillas y sillones. Nuestro propósito fue integrar en una sola aplicación la información de producción, pedidos, clientes, proveedores y operaciones económicas, facilitando la gestión diaria y el seguimiento de cada proceso.

La solución combina una **interfaz en React**, una **API REST con Node.js y Express**, una **base de datos PostgreSQL** y una **aplicación de escritorio mediante Electron**.

![Panel de control de AcuApp, obtenido de la documentación final del proyecto](docs/images/01-dashboard.png)

## Funcionalidades

| Área | Qué permite realizar |
| --- | --- |
| **Panel de control** | Consultar indicadores de producción y facturación, gráficos, avisos de pagos pendientes y herramientas de respaldo y restauración. |
| **Productos y producción** | Registrar y consultar productos, filtrar por estado, editar registros, generar planillas y seguir los estados pendiente, en producción, terminado y enviado. |
| **Insumos y precios** | Administrar insumos y actualizar valores individualmente o mediante ajustes porcentuales. |
| **Clientes** | Registrar y editar clientes y direcciones, consultar sus pedidos, movimientos, pagos y saldos; bloquear o reactivar registros. |
| **Proveedores** | Gestionar proveedores y consultar sus facturas, pagos, movimientos y saldos. |
| **Pedidos de clientes** | Crear y editar pedidos, asociar productos disponibles, gestionar información de facturación y generar documentos PDF. |
| **Facturas y remitos** | Registrar comprobantes de proveedores, asociar archivos y consultar su estado de pago. |
| **Pagos y cuentas corrientes** | Registrar pagos de clientes y proveedores, aplicar pagos totales o parciales y consultar saldos pendientes y a favor. |

### Reglas de negocio relevantes

- El estado de los productos refleja su avance en el circuito de producción y envío.
- Los pedidos se vinculan con clientes y productos disponibles; los estados de producción y de pago se gestionan por separado.
- Los pagos se aplican a pedidos o facturas y actualizan los movimientos y saldos correspondientes.
- Para preservar la trazabilidad, los clientes y proveedores que poseen movimientos asociados pueden bloquearse en lugar de eliminarse definitivamente.

## Capturas del sistema

Las siguientes imágenes provienen del **Manual de Usuario definitivo (2026)**. Se seleccionaron pantallas de demostración y se reemplazaron los nombres identificables por datos genéricos cuando correspondía.

| Productos y seguimiento de producción | Lista de precios e insumos |
| :---: | :---: |
| ![Productos: listado, estados y acciones de producción](docs/images/02-productos.png) | ![Insumos: administración y filtros de precios](docs/images/03-insumos.png) |

| Registro de clientes | Creación de pedidos |
| :---: | :---: |
| ![Formulario de alta de clientes](docs/images/04-cliente-formulario.png) | ![Formulario de creación de pedidos](docs/images/05-pedido-formulario.png) |

**Registro de pagos:**

<p align="center"><img src="docs/images/06-pago-formulario.png" alt="Formulario de registro de pagos de AcuApp" width="540" /></p>

## Tecnologías y arquitectura

| Componente | Tecnologías |
| --- | --- |
| **Interfaz** | JavaScript, React, Vite, Tailwind CSS |
| **Backend y servicios** | Node.js, Express, API REST |
| **Persistencia** | PostgreSQL y consultas SQL |
| **Aplicación de escritorio** | Electron, Electron Builder |
| **Gráficos** | Recharts |
| **Desarrollo colaborativo** | Git y GitHub |

La interfaz consume los servicios del backend, que concentran la lógica de negocio y las operaciones sobre la base de datos. Electron permite utilizar la aplicación como programa de escritorio.

```text
Practicas-Profesionalizantes/
├── assets/                 # Recursos gráficos
├── database/               # Scripts SQL del proyecto
├── src/
│   ├── backend/
│   │   ├── config/          # Configuración del servidor y base de datos
│   │   ├── controllers/     # Lógica de negocio
│   │   ├── routes/          # Endpoints REST
│   │   └── server.js        # Servidor Express
│   ├── electron/            # Integración con Electron
│   └── frontend/            # Aplicación React
├── docs/images/             # Capturas preparadas para esta documentación
├── package.json
└── README.md
```

## Ejecución en entorno de desarrollo

### Requisitos

- **Node.js 20 o superior**, npm y Git.
- Una base PostgreSQL **de prueba** con sus credenciales configuradas localmente.
- La configuración de acceso y licencia correspondiente para utilizar las funciones protegidas.

### Puesta en marcha

1. Clonar el proyecto:

   ```bash
   git clone https://github.com/Ignagatti/Practicas-Profesionalizantes.git
   cd Practicas-Profesionalizantes
   ```

2. Instalar dependencias:

   ```bash
   npm install
   ```

3. Configurar un archivo **`.env` local y no versionado** con las variables necesarias para la conexión de desarrollo. Utilizar exclusivamente credenciales de una base de prueba; no incorporar contraseñas ni claves reales al repositorio. Consultar la plantilla `.env.example` **solo cuando haya sido saneada**.

4. Iniciar frontend y backend:

   ```bash
   npm run dev
   ```

Este comando inicia los servicios para trabajar en desarrollo. **No proporciona por sí solo una base de datos ni una licencia de demostración.** Los instaladores de escritorio no se distribuyen desde este README.

## Equipo y contribuciones

Este sistema fue desarrollado de manera **colaborativa** por estudiantes de la Tecnicatura Superior en Desarrollo de Software del ITEC El Molino. Durante el proyecto compartimos tareas de desarrollo, integración, relevamiento, pruebas y documentación.

| Integrante | Principales aportes |
| --- | --- |
| **[Micaela Cammisi](https://github.com/MCammisiMicaela)** | Desarrollo e integración de funcionalidades de **clientes y pedidos** (frontend/backend), ajustes relacionados con proveedores y datos, mejoras de interfaz y pruebas funcionales manuales. [Integración de clientes](https://github.com/Ignagatti/Practicas-Profesionalizantes/commit/18e7dfdb42276aee638ee0df2f8a86efa882fba5) · [Pedidos](https://github.com/Ignagatti/Practicas-Profesionalizantes/commit/88e45ea8b0dd4130e738778718385aba20744f07). |
| **[Ivana Bertram](https://github.com/ivanabertram)** | Principalmente **relevamiento de requerimientos y documentación funcional y de usuario**; también aportes de código al frontend de clientes, proveedores y precios, y a funcionalidades relacionadas con facturas, pagos y movimientos. [Frontend](https://github.com/Ignagatti/Practicas-Profesionalizantes/commit/0d042fe413a317f9bd6e4340acea3194a7a1204e) · [Facturas, pagos y saldos](https://github.com/Ignagatti/Practicas-Profesionalizantes/commit/3b03f75053b9cddb09391289182c3ffe909bee8d). |
| **[Ignacio Gatti](https://github.com/Ignagatti)** | Desarrollo e integración de módulos, configuración técnica y de la base de datos, implementación y ajustes de funcionalidades, interfaz, mantenimiento y empaquetado con Electron. [Reglas de negocio](https://github.com/Ignagatti/Practicas-Profesionalizantes/commit/4c327911589b91fe69d2310cb10cff27a625357a) · [Ajustes de escritorio](https://github.com/Ignagatti/Practicas-Profesionalizantes/commit/b8a157da94410e6e2d94f6d7c4667b5b86b70d58). |

Las contribuciones indicadas sintetizan responsabilidades y cambios registrados durante el trabajo en equipo; **no implican autoría exclusiva de los módulos**. Los commits y el historial del repositorio permiten consultar su evolución.

## Documentación

El equipo elaboró el **Manual de Usuario de AcuApp (2026)** como parte de la entrega final. Allí se explican las operaciones habituales de cada módulo, las validaciones visibles para el usuario y recomendaciones para el uso administrativo del sistema.

Por tratarse de una aplicación que puede manejar información comercial, la documentación pública utiliza capturas preparadas para demostración y no incluye credenciales, licencias de acceso ni bases de datos privadas.

---

**AcuApp · Proyecto académico colaborativo · ITEC El Molino · 2026**
