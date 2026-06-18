function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getPagination(query = {}, { defaultLimit = 25, maxLimit = 100 } = {}) {
  const page = parsePositiveInteger(query.page, 1);
  const limit = Math.min(parsePositiveInteger(query.limit, defaultLimit), maxLimit);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit,
  };
}

function paginatedResponse(items, total, { page, limit }) {
  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    },
  };
}

module.exports = { getPagination, paginatedResponse };
