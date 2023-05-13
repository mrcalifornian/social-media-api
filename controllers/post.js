const { validationResult } = require("express-validator");

const Post = require("../models/post");
const User = require("../models/user");
const Comment = require("../models/comment");

// Fetch all the posts
exports.getPosts = async (req, res, next) => {
  try {
    const currentPage = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.limit) || 10;
    let totalPosts = await Post.countDocuments();

    let posts = await Post.find()
      .populate({
        path: "creator",
        select: "name",
      })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    res.status(200).json({
      posts: posts.reverse(),
      sentPosts: posts.length,
      currentPage: currentPage,
      totalPosts: totalPosts,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
    return error;
  }
};

// Fetch a single post
exports.getPost = async (req, res, next) => {
  try {
    let postId = req.params.postId;

    let post = await Post.findById(postId).populate({
      path: "creator",
      select: "name",
    });

    if (!post) {
      const error = new Error("Post not found!");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json(post);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
    return error;
  }
};

// Create a new post
exports.createPost = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const error = new Error("Validation error");
      error.statusCode = 400;
      error.data = errors.array();
      throw error;
    }

    let title = req.body.title;
    let post = req.body.post;
    let creator = req.body.userId;

    let user = await User.findById(creator);
    if (!user) {
      const error = new Error("Invalid user ID!");
      error.statusCode = 404;
      throw error;
    }

    let newPost = new Post({
      title: title,
      post: post,
      creator: creator,
    });

    user.posts.push(newPost);
    await newPost.save();
    await user.save();

    res.status(201).json({
      message: "Post created successfully!",
      post: newPost,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
    return error;
  }
};

// Edit a post
exports.updatePost = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors) {
      const error = new Error("Validation error");
      error.statusCode = 400;
      error.data = errors.array();
      throw error;
    }

    let postId = req.params.postId;
    let title = req.body.title;
    let post = req.body.post;
    let creator = req.body.userId;

    let existingPost = await Post.findById(postId);
    if (!existingPost) {
      const error = new Error("Post to be edited not found");
      error.statusCode = 404;
      throw error;
    }

    let isAuthor = creator == existingPost.creator;

    if (!isAuthor) {
      const error = new Error("Creator ID didn't match!");
      error.statusCode = 403;
      throw error;
    }

    existingPost.title = title;
    existingPost.post = post;
    existingPost = await existingPost.save();

    res
      .status(200)
      .json({ message: "Post edited successfully", post: existingPost });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
    return error;
  }
};

// Delete a post
exports.deletePost = async (req, res, next) => {
  try {
    let postId = req.params.postId;
    let post = await Post.findById(postId);
    if (!post) {
      const error = new Error("Post to delete not found!");
      error.statusCode = 404;
      throw error;
    }

    await User.findByIdAndUpdate(post.creator, {
      $pull: { posts: postId },
    });

    let comments = await Comment.find({ post: postId });
    let commentUserIds = comments.map((comment) => comment.creator);

    await User.updateMany(
      { _id: { $in: commentUserIds } },
      { $pull: { comments: { $in: post.comments } } }
    );

    let deletedPost = await Post.findByIdAndDelete(postId);
    await Comment.deleteMany({ post: postId });

    res.status(200).json({
      message: "Post deleted successfully",
      post: deletedPost,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
    return error;
  }
};
