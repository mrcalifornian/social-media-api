const router = require("express").Router();
const authController = require("../controllers/auth");
const { body } = require("express-validator");

router.post(
  "/signup",
  [
    body("email")
      .exists()
      .withMessage("Parameter email is required")
      .isEmail()
      .normalizeEmail(),
    body("password")
      .exists()
      .withMessage("Parameter password is required")
      .trim()
      .isLength({ min: 8 })
      .withMessage("Parameter password must be at least 8 character long"),
    body("name").trim().notEmpty(),
  ],
  authController.signup
);

// User log in
router.post(
  "/login",
  [
    body("email")
      .exists()
      .withMessage("Parameter email is required")
      .isEmail()
      .normalizeEmail(),
    body("password")
      .exists()
      .withMessage("Parameter password is required")
      .trim()
      .isLength({ min: 8 })
      .withMessage("Parameter password must be at least 8 character long"),
  ],
  authController.login
);

module.exports = router;
