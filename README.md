# Botonera PWA

Botonera de sonidos mobile-first que funciona sin conexión. Los audios permanecen en IndexedDB dentro del dispositivo y el modo de cada botón se guarda en `localStorage`.

## Funciones

- Importación múltiple de archivos de audio desde el dispositivo.
- Tres modos por botón: reproducción completa, mientras se mantiene presionado y loop.
- Reproducción de diferentes botones en simultáneo y control para detener todo.
- Edición del nombre y eliminación de sonidos.
- Respaldo portable con configuración y audios en un archivo `.botonera.json`.
- App instalable y offline mediante Web App Manifest y Service Worker.
- Diseño responsive, táctil y accesible.

## Desarrollo local

No requiere instalar dependencias.

```bash
npm start
```

Abrir [http://localhost:4173](http://localhost:4173).

```bash
npm test
npm run check
npm run build
```

## Publicar en Cloudflare Pages

### Opción recomendada: GitHub + despliegue automático

1. Crear un repositorio en GitHub y subir el contenido de esta carpeta.
2. Crear o iniciar sesión en una cuenta de Cloudflare.
3. Ir a **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
4. Autorizar GitHub y elegir el repositorio de Botonera.
5. Configurar el despliegue:
   - Production branch: `main`
   - Framework preset: `None`
   - Build command: `npm run build`
   - Build output directory: `dist`
6. Seleccionar **Save and Deploy**.
7. Abrir la URL `https://<nombre-del-proyecto>.pages.dev` y verificar la instalación/offline.

Cada `push` posterior a `main` publicará una versión nueva automáticamente.

### Opción rápida: carga directa

Ejecutar primero `npm run build`. En Cloudflare Pages elegir **Create application** → **Get started** → **Drag and drop your files** y subir la carpeta `dist`. Esta modalidad no puede convertirse luego en una integración Git dentro del mismo proyecto de Pages.

## Privacidad y almacenamiento

Los audios no se suben a Cloudflare ni a ningún servidor. El navegador puede borrar los datos si el usuario limpia el almacenamiento del sitio; por eso se recomienda exportar respaldos regularmente.
