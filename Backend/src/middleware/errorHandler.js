const multer = require('multer');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'El archivo es demasiado grande' });
  }

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Error de upload: ${err.message}` });
  }

  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'campo';
    return res.status(409).json({ error: `Ya existe un registro con ese ${field}` });
  }

  if (err.code === 'P2003') {
    return res.status(400).json({ error: 'Referencia invalida' });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Registro no encontrado' });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode >= 500
    ? 'Error interno del servidor'
    : err.message || 'Error interno del servidor';

  return res.status(statusCode).json({ error: message });
};

module.exports = errorHandler;
