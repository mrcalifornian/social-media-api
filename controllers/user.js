const User = require("../models/user");

exports.getUser = async (req, res, next) => {
  try {
    let userId = req.params.userId;

    let userData = await User.findById(userId)
      .select("-password")
      .populate({
        path: "posts",
        select: ["title", "post"],
      });

    if (!userData) {
      const error = new Error("Invalid user ID!");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json(userData);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
    return error;
  }
};
