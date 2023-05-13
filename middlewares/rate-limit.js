const rateLimit = require("express-rate-limit");

module.exports = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  keyGenerator: (req, res, next) => {
    return req.headers.authorization;
  },
});
