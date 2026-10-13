# Sistema de Gestión Acuaber — Fábrica de Sillas y Sillones
### Proyecto Final de Prácticas Profesionalizantes
**Estudiante:** Ignacio Gatti  
**Localidad:** Esperanza, Santa Fe, Argentina  

---

## 📌 ¿De qué trata este proyecto?

Este sistema es el trabajo final que desarrollé para mis **Prácticas Profesionalizantes**. Es una aplicación completa de escritorio y web pensada para resolver el día a día de la fábrica de muebles **Acuaber** (ubicada en Esperanza, Santa Fe).

La idea principal fue digitalizar y ordenar todos los procesos de la empresa en un solo lugar:
* Seguir la fabricación de sillas y sillones en el taller paso a paso.
* Manejar el catálogo de materias primas y actualizar los precios de insumos en lote cuando hay aumentos.
* Cargar los pedidos de los clientes, calculando automáticamente el 21% de IVA (si lleva factura) y adjuntando comprobantes en PDF.
* Registrar las compras y facturas de proveedores.
* Administrar las cobranzas y pagos con cuentas corrientes, aplicando saldo a favor y un algoritmo FIFO para saldar deudas de las facturas más viejas a las más nuevas.
* Generar copias de seguridad de toda la base de datos en archivos `.sql` y poder restaurarlas cuando sea necesario.

---

## 🚀 ¿Cómo probar o ejecutar el sistema?

Podés probar el sistema de dos formas distintas: **usando el ejecutable listo para usar de Windows** (la forma más rápida, sin instalar nada de programación) o **levantando el proyecto en modo desarrollo** con el código fuente.

---

### Opción 1: Probar el ejecutable de Windows (Forma rápida)

Ya dejé compilada la aplicación dentro de la carpeta `dist-electron/`. Tenés dos opciones:

1. **Versión Portable (la más recomendada para probar):**
   * Vas a la carpeta `dist-electron/` y abrís el archivo **`Acuaber-Portable.exe`**.
   * Le hacés doble clic y listo. No tenés que instalar nada ni pide permisos de administrador; abre la aplicación directo a pantalla completa.

2. **Instalador normal para Windows:**
   * Abrís **`dist-electron/Acuaber-Instalador.exe`**.
   * Te abre el típico instalador de Windows paso a paso y te deja el acceso directo en el Escritorio y en el Menú Inicio.

> 🔑 **Dato clave para entrar:**  
> La primera vez que abras el sistema te va a pedir una clave de activación. Usá la clave de fábrica:  
> **`ACUABER-FABRICA-2026`**  
> (Titular: *Acuaber Fábrica Central*). La ponés una sola vez, se guarda sola y ya te habilita todas las pantallas.

---

### Opción 2: Correr el proyecto en modo desarrollo (con el código fuente)

Si querés revisar el código, hacer pruebas o ver cómo está programado:

#### 1. Qué necesitás tener instalado
* **Node.js** (versión 20 o superior): [Descargar acá](https://nodejs.org/)
* **Git**
* Conexión a internet (para conectar con la base de datos en Neon Cloud)

#### 2. Clonar el repositorio
Abrís la terminal o PowerShell y ponés:
```bash
git clone https://github.com/Ignagatti/Practicas-Profesionalizantes.git
cd Practicas-Profesionalizantes
```

#### 3. Instalar las dependencias
Instalás todas las librerías del backend y frontend con:
```bash
npm install
```

#### 4. Configurar las variables de entorno (`.env`)
En la raíz del proyecto ya dejé un archivo de ejemplo llamado `.env.example`. Creá una copia llamada `.env`:
```bash
cp .env.example .env
```

Adentro del `.env` tiene que estar la conexión a la base de datos:
```env
PORT=4000
NODE_ENV=development
DATABASE_URL="postgresql://neondb_owner:npg_qDz2RFItbiA8@ep-steep-smoke-ay5b02jw-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=verify-full"
VITE_API_URL="http://localhost:4000/api"
```

*(La base de datos ya está creada y funcionando en la nube con **Neon Cloud PostgreSQL**, así que no hace falta que instales PostgreSQL en tu máquina para probarlo).*

#### 5. Arrancar la aplicación
Para iniciar el backend y el frontend juntos con un solo comando:
```bash
npm run dev
```

Una vez que arrancó:
* Se te abre la pantalla en tu navegador en: [http://localhost:5173](http://localhost:5173)
* La API del servidor queda escuchando en: [http://localhost:4000/api](http://localhost:4000/api)

---

## 🛠️ ¿Cómo compilar de nuevo los instaladores?

Si hacés algún cambio en el código y querés volver a generar el archivo `.exe` para pasárselo a alguien:

```bash
npm run build:exe
```
Ese comando compila el frontend con Vite y empaqueta todo con `electron-builder`. Cuando termina, te deja los nuevos `.exe` listos en la carpeta `dist-electron/`.

---

## 💻 ¿Qué tecnologías usé?

* **Aplicación de Escritorio:** Electron 41 con Electron Builder (para armar los ejecutables de Windows).
* **Frontend:** React 19, Vite (para compilar rápido), Tailwind CSS v4 para el diseño y Lucide React para los iconos.
* **Métricas y Gráficos:** Recharts (para mostrar los gráficos interactivos de ventas vs. compras en el Dashboard).
* **Backend:** Node.js con Express 5.
* **Subida de Archivos:** Multer (guarda los comprobantes de proveedores en disco y las facturas de clientes en formato binario `BYTEA` en la base).
* **Base de Datos:** PostgreSQL en la nube (Neon Cloud) usando el driver nativo `pg` con transacciones seguras (ACID) y bloqueos `FOR UPDATE` para no duplicar pagos.
* **Seguridad:** Helmet para cabeceras HTTP, CORS configurado para Electron y Vite, y un sistema propio de licencias con caché en memoria.

---

## 📁 ¿Cómo está organizado el proyecto?

```
Practicas-Profesionalizantes/
├── .env.example         # Plantilla con las variables necesarias
├── package.json         # Dependencias y scripts de ejecución
├── assets/              # Logo institucional e icono de la app
├── database/            # Script SQL original con las tablas y enums
├── dist-electron/       # Los archivos .exe ya compilados (Portable e Instalador)
└── src/
    ├── backend/         # La API hecha en Node.js + Express
    │   ├── server.js    # Punto de arranque y middlewares
    │   ├── controllers/ # Lógica de cada módulo (pedidos, pagos, etc.)
    │   ├── routes/      # Rutas de la API y subida de archivos
    │   ├── uploads/     # Carpeta donde se guardan los PDFs de proveedores
    │   └── utils/       # Funciones matemáticas para no errarle a los decimales
    ├── electron/        # Archivos que crean la ventana de escritorio
    └── frontend/        # Toda la interfaz hecha en React
        ├── App.jsx      # Componente principal y control de licencia
        ├── Sidebar.jsx  # El menú de navegación de la izquierda
        ├── pages/       # Las pantallas (Dashboard, Productos, Pedidos, etc.)
        └── components/  # Modales, alertas y botones reutilizables
```

---

## 👤 Autor

* **Estudiante:** Ignacio Gatti
* **Proyecto:** Prácticas Profesionalizantes
* **Empresa destino:** Acuaber Fábrica de Sillas y Sillones
* **Esperanza, Santa Fe, Argentina**
