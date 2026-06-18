function validateBody(rules) {
  return (req, res, next) => {
    const errors = [];

    for (const [field, validators] of Object.entries(rules)) {
      for (const validator of validators) {
        const message = validator(req.body[field], req.body);
        if (message) errors.push({ field, message });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Datos invalidos', details: errors });
    }

    next();
  };
}

const isBlank = (value) => (
  value === undefined ||
  value === null ||
  (typeof value === 'string' && value.trim() === '')
);

const required = (label = 'Campo') => (value) => {
  if (isBlank(value)) {
    return `${label} es requerido`;
  }
  return null;
};

const isEmail = () => (value) => {
  if (!value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return null;
  return 'Email invalido';
};

const oneOf = (values, label = 'Valor') => (value) => {
  if (value === undefined || value === null || value === '') return null;
  return values.includes(value) ? null : `${label} invalido`;
};

const isDate = (label = 'Fecha') => (value) => {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return `${label} invalida`;

  const parsed = new Date(`${value}T00:00:00.000Z`);
  const [year, month, day] = String(value).split('-').map(Number);
  const isValid = parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() + 1 === month &&
    parsed.getUTCDate() === day;

  return isValid ? null : `${label} invalida`;
};

const isNumber = (label = 'Numero') => (value) => {
  if (value === undefined || value === null || value === '') return null;
  return Number.isNaN(Number(value)) ? `${label} invalido` : null;
};

module.exports = { validateBody, required, isEmail, oneOf, isDate, isNumber };
