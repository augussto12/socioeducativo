const prisma = require('../config/database');

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 180);
}

async function createUniqueSlug(modelName, value, excludeId) {
  const base = slugify(value);
  let slug = base || 'item';
  let counter = 2;

  while (true) {
    const existing = await prisma[modelName].findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing || existing.id === excludeId) {
      return slug;
    }

    slug = `${base}-${counter}`;
    counter += 1;
  }
}

module.exports = { slugify, createUniqueSlug };
