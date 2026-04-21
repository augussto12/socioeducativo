/**
 * Global error handler middleware.
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'El archivo es demasiado grande. Máximo 5MB.' });
  }

  // Multer general error
  if (err instanceof require('multer').MulterError) {
    return res.status(400).json({ error: `Error de upload: ${err.message}` });
  }

  // Prisma known errors
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'campo';
    return res.status(409).json({ error: `Ya existe un registro con ese ${field}` });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Registro no encontrado' });
  }

  // JWT errors are handled in auth middleware

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  // Default
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Error interno del servidor'
    : err.message || 'Error interno del servidor';

  res.status(statusCode).json({ error: message });
};

module.exports = errorHandler;
