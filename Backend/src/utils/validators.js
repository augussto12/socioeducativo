/**
 * Validate required fields in request body.
 * @param {Object} body - req.body
 * @param {string[]} fields - Required field names
 * @returns {string|null} Error message or null if valid
 */
function validateRequired(body, fields) {
  const missing = fields.filter(f => !body[f] && body[f] !== 0 && body[f] !== false);
  if (missing.length > 0) {
    return `Campos requeridos faltantes: ${missing.join(', ')}`;
  }
  return null;
}

/**
 * Validate UUID format.
 */
function isValidUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

module.exports = { validateRequired, isValidUUID };
