# Contribuir a Sonidera

¡Gracias por querer mejorar Sonidera! Se aceptan reportes de errores, ideas, documentación, accesibilidad, nuevos temas visuales y mejoras de código.

## Antes de empezar

- Buscá en los issues existentes para evitar duplicados.
- Para cambios grandes, abrí primero una propuesta explicando el problema y la solución.
- No agregues audios, imágenes, fuentes ni otros recursos sin permiso de redistribución.
- Nunca incluyas sonidos personales de una botonera: los audios de cada usuario permanecen en su dispositivo y no forman parte del repositorio.

## Desarrollo

El proyecto no requiere instalar dependencias.

```bash
npm start
```

Antes de enviar un pull request:

```bash
npm test
npm run check
npm run build
```

## Flujo recomendado

1. Creá un fork del repositorio.
2. Creá una rama descriptiva, por ejemplo `feat/nuevo-tema` o `fix/reproduccion-loop`.
3. Hacé cambios pequeños y enfocados.
4. Agregá pruebas cuando cambie el comportamiento.
5. Abrí un pull request explicando qué cambia, por qué y cómo lo verificaste.

## Temas visuales

Los temas deben compartir el HTML y la lógica de audio existentes. Consultá [`docs/crear-tema-visual.md`](docs/crear-tema-visual.md) para conocer la estructura, los estados y el proceso de incorporación.

## Estilo de colaboración

Tratemos a todas las personas con respeto. El feedback debe enfocarse en el proyecto y ser claro, constructivo e inclusivo. El mantenimiento del proyecto puede moderar o rechazar interacciones abusivas, discriminatorias o que expongan información privada.
