const expect = require("chai").expect;
const sinon = require("sinon");

const CommentController = require("../controllers/comment");
const User = require("../models/user");
const Post = require("../models/post");
const Comment = require("../models/comment");

describe("Comment Controller", () => {
  describe("Fetch all comments for a post", () => {
    const req = {
      params: {
        postId: "61352767321987",
      },
      query: {
        page: 1,
        limit: 10,
      },
    };

    it("should throw Error 404 if post by id not found", async () => {
      sinon.stub(Post, "findById").returns(false);

      try {
        let error = await CommentController.fetchAll(req, {}, () => {});
        expect(error).to.be.an("Error");
        expect(error).to.have.property("message", "Post not found");
        expect(error.statusCode).to.equal(404);
      } finally {
        Post.findById.restore();
      }
    });

    it("should throw Error 500 if an unrecognized error occurs", async () => {
      sinon.stub(Post, "findById").throws();

      try {
        let error = await CommentController.fetchAll(req, {}, () => {});
        expect(error).to.be.an("Error");
        expect(error.statusCode).to.equal(500);
      } finally {
        Post.findById.restore();
      }
    });

    it("should return the comments if succeeds", async () => {
      let res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      let comments = {
        comments: [
          {
            _id: "6457f8c064e3d6902b40782e",
            comment: "Indeed",
            creator: {
              _id: "64568b5263b9c03977d7a9f2",
              name: "Nodir",
            },
            post: "6457f43e64e3d6902b4077fb",
            createdAt: "2023-05-07T19:15:12.139Z",
            updatedAt: "2023-05-07T19:15:12.139Z",
            __v: 0,
          },
          {
            _id: "6457f8db64e3d6902b407836",
            comment: "Cleary",
            creator: {
              _id: "6457d0eba6ec42b853e486c0",
              name: "MCL",
            },
            post: "6457f43e64e3d6902b4077fb",
            createdAt: "2023-05-07T19:15:39.832Z",
            updatedAt: "2023-05-07T19:15:39.832Z",
            __v: 0,
          },
        ],
        sentComments: 2,
        currentPage: 1,
        totalComments: 5,
      };

      sinon.stub(Post, "findById").returns(true);
      sinon.stub(Comment, "countDocuments").returns(comments.totalComments);
      sinon.stub(Comment, "find").returns({
        populate: sinon.stub().returnsThis(),
        skip: sinon.stub().returnsThis(),
        limit: sinon.stub().returns(comments.comments),
      });

      try {
        await CommentController.fetchAll(req, res, () => {});
        expect(res.status.calledOnceWith(200)).to.be.true;
        expect(res.json.calledOnceWith(comments)).to.be.true;
      } finally {
        Post.findById.restore();
        Comment.countDocuments.restore();
        Comment.find.restore();
      }
    });
  });

  describe("Create a new comment", async () => {
    const req = {
      body: {
        postId: "P64762761261987",
        userId: "U64762761261987",
        comment: "This is a comment",
      },
    };

    it("should retutrn error 404 Invalid user ID! if user with this ID not found", async () => {
      sinon.stub(User, "findById").returns(false);

      try {
        const error = await CommentController.createComment(req, {}, () => {});
        expect(error).to.be.an("Error");
        expect(error.statusCode).to.equal(404);
        expect(error.message).to.equal("Invalid user ID!");
      } finally {
        User.findById.restore();
      }
    });

    it("should retutrn error 404 Invalid post ID! if post with this ID not found", async () => {
      sinon.stub(User, "findById").returns(true);
      sinon.stub(Post, "findById").returns(false);

      try {
        const error = await CommentController.createComment(req, {}, () => {});
        expect(error).to.be.an("Error");
        expect(error.statusCode).to.equal(404);
        expect(error.message).to.equal("Invalid post ID!");
      } finally {
        User.findById.restore();
        Post.findById.restore();
      }
    });

    it("should return 500 if internal error occurs", async () => {
      sinon.stub(Comment.prototype, "save").throws();
      sinon.stub(User, "findById").returns({
        comments: [],
        save: sinon.stub().resolves(),
      });
      sinon.stub(Post, "findById").returns({
        comments: [],
        save: sinon.stub().resolves(),
      });
      try {
        const error = await CommentController.createComment(req, {}, () => {});
        expect(error).to.be.an("Error");
        expect(error.statusCode).to.equal(500);
      } finally {
        Comment.prototype.save.restore();
        User.findById.restore();
        Post.findById.restore();
      }
    });

    it("should return the new created comment if succeeds", async () => {
      let res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      sinon.stub(Comment.prototype, "save").returns(req.body);
      sinon.stub(User, "findById").returns({
        comments: [],
        save: sinon.stub().resolves(),
      });
      sinon.stub(Post, "findById").returns({
        comments: [],
        save: sinon.stub().resolves(),
      });
      try {
        const error = await CommentController.createComment(req, res, () => {});
        if (error) {
          console.log(error);
        }

        expect(res.status.calledOnceWith(201)).to.be.true;
        expect(
          res.json.calledOnceWith({
            message: "New comment created",
            comment: req.body,
          })
        ).to.be.true;
      } finally {
        Comment.prototype.save.restore();
        User.findById.restore();
        Post.findById.restore();
      }
    });
  });
  describe("Edit a comment", () => {
    const req = {
      params: {
        commentId: "C85765767868",
      },
      body: {
        comment: "Edited comment",
      },
    };
    it("should throw error 404 if comment not found", async () => {
      sinon.stub(Comment, "findById").returns(false);
      try {
        const error = await CommentController.updateComment(req, {}, () => {});
        expect(error).to.be.an("Error");
        expect(error.statusCode).to.equal(404);
        expect(error.message).to.equal("Comment not found");
      } finally {
        Comment.findById.restore();
      }
    });

    it("should throw error 500 if there is internal error", async () => {
      sinon.stub(Comment, "findById").returns({
        save: sinon.stub().throws(),
      });
      try {
        const error = await CommentController.updateComment(req, {}, () => {});
        expect(error).to.be.an("Error");
        expect(error.statusCode).to.equal(500);
      } finally {
        Comment.findById.restore();
      }
    });

    it("should return  the edited comment if succeeds", async () => {
      let res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      let comment = {
        postId: "P64762761261987",
        userId: "U64762761261987",
        comment: "This is a comment",
      };

      let updatedComment = {
        postId: "P64762761261987",
        userId: "U64762761261987",
        comment: req.body.comment,
      };

      sinon.stub(Comment, "findById").returns({
        comment: sinon.stub().returns(comment),
        save: sinon.stub().returns(updatedComment),
      });

      try {
        const error = await CommentController.updateComment(req, res, () => {});
        if (error) {
          console.log(error);
        }
        expect(res.status.calledOnceWith(200)).to.be.true;
        expect(
          res.json.calledOnceWith({
            message: "Comment edited successfully!",
            comment: updatedComment,
          })
        ).to.be.true;
      } finally {
        Comment.findById.restore();
      }
    });
  });

  describe("Delete a comment", () => {
    const req = {
      params: {
        commentId: "C85765767868",
      },
    };

    it("should throw error 404 if comment not found", async () => {
      sinon.stub(Comment, "findById").returns(false);
      try {
        const error = await CommentController.deleteComment(req, {}, () => {});
        expect(error).to.be.an("Error");
        expect(error.statusCode).to.equal(404);
        expect(error.message).to.equal("Comment to delete not found!");
      } finally {
        Comment.findById.restore();
      }
    });

    it("should throw error 500 if internal error occurs", async () => {
      sinon.stub(Comment, "findById").returns(true);
      sinon.stub(User, "findByIdAndUpdate").throws();
      try {
        const error = await CommentController.deleteComment(req, {}, () => {});
        expect(error).to.be.an("Error");
        expect(error.statusCode).to.equal(500);
      } finally {
        Comment.findById.restore();
        User.findByIdAndUpdate.restore();
      }
    });

    it("should return the deleted comment if succeeds", async () => {
      let res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      let deletedComment = {
        postId: "P64762761261987",
        userId: "U64762761261987",
        comment: "Comment",
      };

      sinon.stub(Comment, "findById").returns(true);
      sinon.stub(User, "findByIdAndUpdate").resolves();
      sinon.stub(Post, "findByIdAndUpdate").resolves();
      sinon.stub(Comment, "findByIdAndDelete").returns(deletedComment);

      try {
        const error = await CommentController.deleteComment(req, res, () => {});
        if (error) {
          console.log(error);
        }
        expect(res.status.calledOnceWith(200)).to.be.true;
        expect(
          res.json.calledOnceWith({
            message: "Comment deleted successfully!",
            comment: deletedComment,
          })
        ).to.be.true;
      } finally {
        Comment.findById.restore();
        User.findByIdAndUpdate.restore();
        Post.findByIdAndUpdate.restore();
        Comment.findByIdAndDelete.restore();
      }
    });
  });
});
