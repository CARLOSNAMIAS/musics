# Spotify Clone

Una réplica visual y funcional de la interfaz de Spotify, construida con HTML, CSS y JavaScript. Este proyecto utiliza la API de Deezer para la búsqueda de canciones en tiempo real y la reproducción de vistas previas de 30 segundos.

![Spotify Clone Screenshot](https://i.imgur.com/URL-de-tu-screenshot.png)
*Nota: Reemplaza la URL de arriba con una captura de pantalla de tu proyecto.*

---

## ✨ Características

- **Búsqueda en Tiempo Real:** Busca canciones y artistas dinámicamente.
- **Reproductor de Música:** Controles para reproducir, pausar y una barra de progreso funcional.
- **Interfaz Responsiva:** Diseño que se adapta a dispositivos de escritorio, tablet y móviles.
- **Backend Seguro:** Las llamadas a la API de Deezer se manejan a través de una función serverless para no exponer claves o lógica en el frontend.
- **Notificaciones:** Feedback visual para el usuario al realizar acciones.

---

## 🚀 Tecnologías Utilizadas

- **Frontend:**
  - HTML5
  - CSS3 (con variables y diseño responsivo)
  - JavaScript (con jQuery para manipulación del DOM)
- **Backend:**
  - Node.js (para la función serverless)
  - `node-fetch` para realizar peticiones HTTP.
- **API:**
  - [Deezer API](https://developers.deezer.com/api) para la búsqueda de música.
- **Despliegue:**
  - [Vercel](https://vercel.com/) para el hosting del sitio y la ejecución de la función serverless.

---

## 🛠️ Despliegue en Vercel

Para desplegar este proyecto, sigue estos pasos:

1.  **Sube el proyecto a un repositorio de GitHub.**
2.  **Importa el repositorio en Vercel.**
3.  **Configura el "Output Directory":**
    - En la configuración del proyecto en Vercel, ve a **Build and Output Settings**.
    - Activa la opción **Override** para el **Output Directory**.
    - Establece el valor en `public`.

¡Vercel se encargará del resto! Construirá el proyecto, instalará las dependencias de Node.js y desplegará tanto el frontend como la función serverless de la API.
