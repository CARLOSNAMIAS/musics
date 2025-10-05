
// api/search.js

// Exporta una función serverless compatible con Vercel
module.exports = async (req, res) => {
  // Obtiene el término de búsqueda de los parámetros de la URL (ej: /api/search?q=query)
  const query = req.query.q;

  // Valida que se haya proporcionado un término de búsqueda
  if (!query) {
    return res.status(400).json({ error: 'Se requiere un término de búsqueda' });
  }

  try {
    // Importa 'node-fetch' de forma dinámica. 
    // Se usa require en lugar de import porque este es un módulo CommonJS.
    const fetch = (await import('node-fetch')).default;

    // Llama a la API de Deezer de forma segura desde el servidor
    const deezerResponse = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(query)}`);
    
    // Verifica si la respuesta de la API es exitosa
    if (!deezerResponse.ok) {
      throw new Error(`La API de Deezer respondió con el estado: ${deezerResponse.status}`);
    }

    // Convierte la respuesta a JSON
    const data = await deezerResponse.json();

    // Configura los encabezados de la respuesta para permitir el acceso desde cualquier origen (CORS)
    // y para indicar que el contenido es JSON.
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    // Envía los datos de Deezer al frontend
    res.status(200).json(data);

  } catch (error) {
    // Manejo de errores en caso de que falle la llamada a la API
    console.error('Error al contactar la API de Deezer:', error);
    res.status(500).json({ error: 'Error interno del servidor al buscar canciones.' });
  }
};
