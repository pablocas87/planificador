# planificador

Pequeña aplicación web para organizar la planificación semanal de clases.
Permite seleccionar unidad curricular, contenido y criterio de logro,
completando automáticamente la competencia específica asociada.

Ahora incluye integración opcional con la API de Gemini para generar una
**meta de aprendizaje** y sugerir actividades a partir de los campos
seleccionados.

Para habilitar las funciones de IA:

1. Copia `js/config.example.js` como `js/config.js`.
2. Edita `js/config.js` y escribe tu clave de API en la variable
   `GEMINI_API_KEY`.
3. Asegúrate de que `js/config.js` permanezca fuera del repositorio (ya está
   listado en `.gitignore`).
