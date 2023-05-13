const router = require("express").Router();
const userController = require("../controllers/user");

router.get("/:userId", userController.getUser);

module.exports = router;
