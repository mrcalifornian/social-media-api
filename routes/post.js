const router = require("express").Router();
const postController = require("../controllers/post");
const { body } = require("express-validator");

// Fetch all the posts
router.get("/", postController.getPosts);

// Create a new post
router.post(
  "/post",
  [
    body("title")
      .exists()
      .withMessage("Parameter title is required")
      .notEmpty()
      .trim(),
    body("post")
      .exists()
      .withMessage("Parameter title is required")
      .notEmpty()
      .trim()
      .isLength({ min: 10 }),
    body("userId")
      .exists()
      .withMessage("Parameter userId is required")
      .notEmpty(),
  ],
  postController.createPost
);

// Fetch a single post
router.get("/:postId", postController.getPost);

// Edit a post
router.put(
  "/:postId",
  [
    body("title")
      .exists()
      .withMessage("Parameter title is required")
      .notEmpty()
      .trim(),
    body("post")
      .exists()
      .withMessage("Parameter title is required")
      .notEmpty()
      .trim()
      .isLength({ min: 10 }),
  ],
  postController.updatePost
);

// Delete a post
router.delete("/:postId", postController.deletePost);

module.exports = router;
