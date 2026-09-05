function sendApi(req, res, status, payload) {
  if (req.gameResult) {
    return res.status(status).json({
      game: req.gameResult,
      data: payload,
    });
  }
  return res.status(status).json(payload);
}

function parsePositiveInt(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    return null;
  }
  return n;
}

module.exports = {
  sendApi,
  parsePositiveInt,
};
