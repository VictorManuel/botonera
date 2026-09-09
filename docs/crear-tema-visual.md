# Cómo diseñar a mano un tema para Sonidera

Un tema modifica solamente la apariencia. Los sonidos, nombres, modos y archivos guardados siguen siendo los mismos al cambiar de estilo.

## 1. Dibujá estas dos pantallas

Usá una hoja para cada tamaño:

- **Celular:** proporción aproximada 9:19. Dibujá la barra superior, las acciones principales, el título “Mis sonidos” y una grilla de al menos seis botones.
- **Escritorio:** proporción aproximada 16:9. Incluí la misma información y mostrala en una grilla más ancha.

No hace falta medir en píxeles. Sí conviene marcar márgenes, separaciones y cuál elemento debería llamar primero la atención.

## 2. Incluí los componentes y sus estados

Dibujá por separado:

1. Tarjeta de sonido en reposo.
2. Tarjeta reproduciendo.
3. Botón presionado.
4. Modos Completo, Mantener y Loop, con uno seleccionado.
5. Acciones Agregar, Detener, Editar e Importar/exportar.
6. Selector de estilo.
7. Estado sin sonidos.
8. Ventana de edición y mensajes breves.

Podés anotar movimientos deseados, por ejemplo “vibra”, “rebota”, “se ilumina” o “las ondas se mueven”.

## 3. Definí el lenguaje visual

En un margen de la hoja agregá:

- 4 a 8 colores con su uso (fondo, texto, botón, peligro, etc.). Si podés, escribí sus códigos HEX; si no, alcanza una muestra pintada.
- Estilo de letras: redondas, manuscritas, retro, mecánicas, etc.
- Tipo de borde: fino, grueso, irregular, doble, con sombra.
- Iconos o dibujos recurrentes.
- Una frase que resuma el estilo, por ejemplo: “afiche de historieta impreso con tinta negra y colores planos”.

## 4. Cómo enviármelo

- Escaneá la hoja o sacale una foto perpendicular, con buena luz y sin sombras.
- Enviá PNG, JPG o PDF en la mayor resolución disponible.
- Indicá el **nombre del tema** y qué detalles son obligatorios.
- Si usaste una tipografía, textura o imagen de referencia, adjuntala o compartí su nombre y confirmá que se puede usar.
- Señalá si querés una copia fiel o si puedo interpretar y completar las partes faltantes.

## 5. Qué haré con el material

Voy a traducir el boceto a estilos responsive, accesibles y compatibles con la PWA. Agregaré el tema al selector sin duplicar la lógica de audio y verificaré los estados de reproducción, foco, dispositivos móviles y modo offline.

## Estructura técnica de un tema

Cada tema nuevo requiere:

1. Registrar un identificador, nombre y color del navegador en `js/theme.js`.
2. Agregar reglas bajo `html[data-theme="nombre"]` en `styles.css`.
3. Si hay recursos gráficos, guardarlos en `assets/themes/nombre/` y agregarlos al shell offline de `sw.js`.
4. Añadir o actualizar las pruebas del registro y ejecutar `npm test`, `npm run check` y `npm run build`.

No se deben crear versiones separadas de `index.html` ni de la lógica de reproducción: todos los temas comparten la misma estructura y comportamiento.
