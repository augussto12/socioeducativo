function serialize(value) {
  return JSON.parse(JSON.stringify(value, (_, current) => (
    typeof current === 'bigint' ? Number(current) : current
  )));
}

module.exports = { serialize };
