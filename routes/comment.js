const router = require("express").Router();
const commentController = require("../controllers/comment");
const { body } = require("express-validator");

// Fetch all the comments for a post
router.get("/:postId", commentController.fetchAll);

// Create a new cooment
router.post(
  "/post",
  [
    body("postId")
      .exists()
      .withMessage("Body parameter comment is required")
      .notEmpty()
      .withMessage("Body parameter comment cannot be empty"),

    body("userId")
      .exists()
      .withMessage("Body parameter userId is required")
      .notEmpty()
      .withMessage("Body parameter userId cannot be empty"),

    body("comment")
      .exists()
      .withMessage("Body parameter comment is required")
      .notEmpty()
      .withMessage("Body parameter comment cannot be empty"),
  ],
  commentController.createComment
);

// Update a comment text
router.put(
  "/:commentId",
  [
    body("comment")
      .exists()
      .withMessage("Body parameter comment is required")
      .notEmpty()
      .withMessage("Body parameter comment cannot be empty"),
  ],
  commentController.updateComment
);

// Delete a post
router.delete("/:commentId", commentController.deleteComment);

module.exports = router;
