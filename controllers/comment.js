const { validationResult } = require("express-validator");

const User = require("../models/user");
const Post = require("../models/post");
const Comment = require("../models/comment");

// Fetch all the comments for a post
exports.fetchAll = async (req, res, next) => {
  try {
    let postId = req.params.postId;
    const currentPage = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.limit) || 10;

    let post = await Post.findById(postId);

    if (!post) {
      const error = new Error("Post not found");
      error.statusCode = 404;
      throw error;
    }

    let totalComments = await Comment.countDocuments({ post: postId });

    let comments = await Comment.find({ post: postId })
      .populate({
        path: "creator",
        select: "name",
      })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    res.status(200).json({
      comments: comments,
      sentComments: comments.length,
      currentPage: currentPage,
      totalComments: totalComments,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
    return error;
  }
};

// Create a new cooment
exports.createComment = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const error = new Error("Validation error");
      error.statusCode = 400;
      error.data = errors.array();
      throw error;
    }

    let postId = req.body.postId;
    let userId = req.body.userId;
    let comment = req.body.comment;

    let user = await User.findById(userId);

    if (!user) {
      const error = new Error("Invalid user ID!");
      error.statusCode = 404;
      throw error;
    }

    let post = await Post.findById(postId);
    if (!post) {
      const error = new Error("Invalid post ID!");
      error.statusCode = 404;
      throw error;
    }

    let newComment = new Comment({
      post: postId,
      creator: userId,
      comment: comment,
    });

    user.comments.push(newComment);
    post.comments.push(newComment);

    newComment = await newComment.save();
    await user.save();
    await post.save();

    res.status(201).json({
      message: "New comment created",
      comment: newComment,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
    return error;
  }
};

// Edit a comment
exports.updateComment = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const error = new Error("Validation error");
      error.statusCode = 400;
      error.data = errors.array();
      throw error;
    }

    let commentId = req.params.commentId;
    let commentText = req.body.comment;

    let comment = await Comment.findById(commentId);
    if (!comment) {
      const error = new Error("Comment not found");
      error.statusCode = 404;
      throw error;
    }

    comment.comment = commentText;
    comment = await comment.save();

    res.status(200).json({
      message: "Comment edited successfully!",
      comment: comment,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
    return error;
  }
};

// Delete a comment
exports.deleteComment = async (req, res, next) => {
  try {
    let commentId = req.params.commentId;

    let comment = await Comment.findById(commentId);
    if (!comment) {
      const error = new Error("Comment to delete not found!");
      error.statusCode = 404;
      throw error;
    }

    await User.findByIdAndUpdate(comment.creator, {
      $pull: { comments: comment._id },
    });

    await Post.findByIdAndUpdate(comment.post, {
      $pull: { comments: comment._id },
    });

    let deletedComment = await Comment.findByIdAndDelete(commentId);

    res.status(200).json({
      message: "Comment deleted successfully!",
      comment: deletedComment,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
    return error;
  }
};
