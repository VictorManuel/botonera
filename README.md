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

## Contenedor local

La imagen ejecuta las validaciones y genera `dist` en una etapa con Node. La etapa final sirve únicamente los archivos estáticos con Nginx en el puerto 80.

```bash
docker compose up --build
```

Abrir [http://localhost:8080](http://localhost:8080). El chequeo de salud está disponible en `http://localhost:8080/health`.

## Publicar en Dokploy

El despliegue de producción se construye desde la rama `main` del repositorio privado `VictorManuel/botonera`.

1. En Dokploy crear un proyecto y luego una **Application**.
2. En **Provider**, conectar GitHub y seleccionar:
   - Owner: `VictorManuel`
   - Repository: `botonera`
   - Branch: `main`
   - Trigger: `push`, para desplegar automáticamente cada actualización de `main`.
3. En **Build Type**, seleccionar **Dockerfile** y configurar:
   - Dockerfile Path: `Dockerfile`
   - Docker Context Path: `.`
   - Docker Build Stage: dejar vacío para usar la etapa final `runtime`.
4. No agregar variables de entorno: esta aplicación no las necesita.
5. En **Domains**, agregar el dominio o generar uno temporal y dirigirlo al puerto `80` del contenedor.
6. Activar HTTPS y desplegar.
7. Verificar:
   - `/health` responde `ok`.
   - La página carga por HTTPS.
   - La PWA puede instalarse y abrirse sin conexión después de la primera visita.

Si se usa el proveedor Git genérico en vez de la integración de GitHub, hay que registrar la clave SSH pública de Dokploy en GitHub y usar `git@github.com:VictorManuel/botonera.git` con la rama `main`.

## Privacidad y almacenamiento

Los audios no se suben a Dokploy ni a ningún servidor. El navegador puede borrar los datos si el usuario limpia el almacenamiento del sitio; por eso se recomienda exportar respaldos regularmente.
