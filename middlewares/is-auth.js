const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    const error = new Error("Authorization header missing!");
    error.statusCode = 401;
    throw error;
  }

  const token = authHeader.split(" ")[1];
  let decodedToken;

  if (!token) {
    const error = new Error("Token missing!");
    error.statusCode = 401;
    throw error;
  }

  try {
    decodedToken = jwt.verify(token, process.env.JWP);
  } catch (error) {
    error.statusCode = 500;
    throw error;
  }

  if (!decodedToken) {
    const error = new Error("Invalid token");
    error.statusCode = 498;
    throw error;
  }

  req.userId = decodedToken.userId;
  next();
};
