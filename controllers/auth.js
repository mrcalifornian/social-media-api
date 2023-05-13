const User = require("../models/user");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// New user sign up
exports.signup = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const error = new Error("Validation error!");
      error.statusCode = 400;
      error.data = errors.array();
      throw error;
    }

    let name = req.body.name;
    let email = req.body.email;
    let password = req.body.password;

    let user = await User.findOne({ email: email });
    if (user) {
      const error = new Error("User already exists!");
      error.statusCode = 403;
      throw error;
    }

    let hashedPassword = await bcrypt.hash(password, 12);

    user = new User({
      name: name,
      email: email,
      password: hashedPassword,
    });

    user = await user.save();

    const token = jwt.sign(
      {
        email: email,
        userId: user._id.toString(),
      },
      process.env.JWP,
      { expiresIn: "4h" }
    );

    res.status(201).json({
      message: "New user created",
      token: token,
      userId: user._id,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
    return error;
  }
};

// User log in
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const error = new Error("Validation error!");
      error.statusCode = 400;
      error.data = errors.array();
      throw error;
    }

    let email = req.body.email;
    let password = req.body.password;

    let user = await User.findOne({ email: email });
    if (!user) {
      const error = new Error("User not found!");
      error.statusCode = 404;
      throw error;
    }

    let passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      const error = new Error("Wrong password!");
      error.statusCode = 401;
      throw error;
    }

    const token = jwt.sign(
      {
        email: email,
        userId: user._id.toString(),
      },
      process.env.JWP,
      { expiresIn: "4h" }
    );

    res.status(200).json({
      token: token,
      userId: user._id,
    });

    return;
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
    return error;
  }
};
