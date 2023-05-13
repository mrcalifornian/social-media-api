const expect = require("chai").expect;
const sinon = require("sinon");
const { validationResult } = require("express-validator");
const PostController = require("../controllers/post");
const Post = require("../models/post");
const User = require("../models/user");
const Comment = require("../models/comment");

describe("Post Controller", () => {
  describe("Get Posts", () => {
    let req = {
      query: {
        page: 1,
        limit: 5,
      },
    };

    it("should  throw error 500 if db connection failure", async () => {
      sinon.stub(Post, "countDocuments").throws();
      try {
        let result = await PostController.getPosts(req, {}, () => {});
        expect(result).to.be.an("Error");
        expect(result).to.have.property("statusCode", 500);
      } finally {
        Post.countDocuments.restore();
      }
    });

    it("should return posts if everything goes fine", async () => {
      const posts = {
        posts: [
          {
            _id: "645b819d7871e6315ead0f79",
            title: "Comment",
            post: "A career is what you do—it doesn’t have to reflect who you are. Making a job part of your identity is an option, not an obligation.",
            creator: {
              _id: "6457f3e164e3d6902b4077f9",
              name: "Adam Grant",
            },
            comments: [],
            createdAt: "2023-05-10T11:35:57.174Z",
            updatedAt: "2023-05-10T11:35:57.174Z",
            __v: 0,
          },
          {
            _id: "6457f6a264e3d6902b407828",
            title: "Gratitude",
            post: "A career is what you do—it doesn’t have to reflect who you are. Making a job part of your identity is an option, not an obligation.",
            creator: {
              _id: "6457f3e164e3d6902b4077f9",
              name: "Adam Grant",
            },
            comments: [],
            createdAt: "2023-05-07T19:06:10.289Z",
            updatedAt: "2023-05-07T19:06:10.289Z",
            __v: 0,
          },
        ],
        sentPosts: 2,
        currentPage: 1,
        totalPosts: 12,
      };
      let res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
      sinon.stub(Post, "countDocuments").returns(posts.totalPosts);
      const findStub = sinon.stub(Post, "find");
      findStub.returns({
        populate: sinon.stub().returnsThis(),
        skip: sinon.stub().returnsThis(),
        limit: sinon.stub().returns(posts.posts),
        reverse: sinon.stub().returns(posts.posts),
      });

      try {
        await PostController.getPosts(req, res, () => {});
        expect(res.status.calledOnceWith(200)).to.be.true;
        expect(res.json.calledWith(posts)).to.be.true;
      } finally {
        Post.countDocuments.restore();
        findStub.restore();
      }
    });
  });

  describe("Get a Post", () => {
    const req = {
      params: { postId: "123456" },
    };

    const post = {
      _id: "6457f68e64e3d6902b407824",
      title: "Gratitude",
      post: "If you never say no, people don't respect your time. If you're thoughtful about when you give, they're more selective in their asks.",
      creator: {
        _id: "6457f3e164e3d6902b4077f9",
        name: "Adam Grant",
      },
      comments: [],
      createdAt: "2023-05-07T19:05:50.569Z",
      updatedAt: "2023-05-07T19:05:50.569Z",
      __v: 0,
    };

    it("should return error 404 if post not found", async () => {
      sinon.stub(Post, "findById").returns({
        populate: sinon.stub().returns(false),
      });

      try {
        let result = await PostController.getPost(req, {}, () => {});
        expect(result).to.be.an("Error");
        expect(result).to.have.property("message", "Post not found!");
        expect(result.statusCode).to.equal(404);
      } finally {
        Post.findById.restore();
      }
    });

    it("should return a post if everything goes fine", async () => {
      let res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      sinon.stub(Post, "findById").returns({
        populate: sinon.stub().returns(post),
      });

      try {
        await PostController.getPost(req, res, () => {});
        expect(res.status.calledOnceWith(200)).to.be.true;
        expect(res.json.calledWith(post)).to.be.true;
      } finally {
        Post.findById.restore();
      }
    });

    it("should return error 500 if an Error occurs", async () => {
      sinon.stub(Post, "findById").returns({
        populate: sinon.stub().throws(new Error("Internal Error")),
      });

      try {
        let result = await PostController.getPost(req, {}, () => {});
        expect(result).to.be.an("Error");
        expect(result).to.have.property("message", "Internal Error");
        expect(result.statusCode).to.equal(500);
      } finally {
        Post.findById.restore();
      }
    });
  });

  describe("Create a Post", async () => {
    let req = {
      body: {
        title: "Comment",
        post: "A career is what you do—it doesn’t have to reflect who you are. Making a job part of your identity is an option, not an obligation.",
        userId: "6457f3e164e3d6902b4077f9",
      },
    };

    it("should return error 404 if user Id is invalid", async () => {
      sinon.stub(User, "findById").returns(false);
      try {
        const result = await PostController.createPost(req, {}, () => {});
        expect(result).to.be.an("Error");
        expect(result).to.have.property("message", "Invalid user ID!");
        expect(result.statusCode).to.equal(404);
      } finally {
        User.findById.restore();
      }
    });

    it("should return an error if newPost.save()  fails", async () => {
      sinon.stub(User, "findById").returns({
        posts: [],
        save: sinon.stub().resolves(),
      });
      sinon.stub(Post.prototype, "save").throws();

      try {
        const result = await PostController.createPost(req, {}, () => {});
        expect(result).to.be.an("Error");
        expect(result.statusCode).to.equal(500);
      } finally {
        User.findById.restore();
        Post.prototype.save.restore();
      }
    });

    it("should return an error if user.save()  fails", async () => {
      sinon.stub(User, "findById").returns({
        posts: [],
        save: sinon.stub().throws(),
      });
      sinon.stub(Post.prototype, "save").resolves();

      try {
        const result = await PostController.createPost(req, {}, () => {});
        expect(result).to.be.an("Error");
        expect(result.statusCode).to.equal(500);
      } finally {
        User.findById.restore();
        Post.prototype.save.restore();
      }
    });

    it("should return the created post if succeeds", async () => {
      let res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      sinon.stub(User, "findById").returns({
        posts: [],
        save: sinon.stub().resolves(),
      });
      sinon.stub(Post.prototype, "save").resolves();
      try {
        await PostController.createPost(req, res, () => {});
        expect(res.status.calledOnceWith(201)).to.be.true;
      } finally {
        User.findById.restore();
        Post.prototype.save.restore();
      }
    });
  });

  describe("Update a Post", () => {
    let req = {
      params: {
        postId: "123456789",
      },
      body: {
        title: "Comment",
        post: "A career is what you do—it doesn’t have to reflect who you are. Making a job part of your identity is an option, not an obligation.",
        userId: "6457f3e164e3d6902b4077f9",
      },
    };

    it("should return Error 404 if post not found", async () => {
      sinon.stub(Post, "findById").returns(false);

      try {
        const result = await PostController.updatePost(req, {}, () => {});
        expect(result).to.be.an("Error");
        expect(result).to.have.property(
          "message",
          "Post to be edited not found"
        );
        expect(result).to.have.property("statusCode", 404);
      } finally {
        Post.findById.restore();
      }
    });

    it("should return Error 403 if userID does not match", async () => {
      let fakePost = {
        title: "Comment",
        post: "A career is what you do—it doesn’t have to reflect who you are. Making a job part of your identity is an option, not an obligation.",
        creator: "6457f3e164e3d6902b4767077f9",
      };

      sinon.stub(Post, "findById").returns(fakePost);

      try {
        const result = await PostController.updatePost(req, {}, () => {});
        expect(result).to.be.an("Error");
        expect(result).to.have.property("message", "Creator ID didn't match!");
        expect(result).to.have.property("statusCode", 403);
      } finally {
        Post.findById.restore();
      }
    });

    it("should return Error 500 in internal error", async () => {
      let fakePost = {
        title: "Comment",
        post: "A career is what you do—it doesn’t have to reflect who you are. Making a job part of your identity is an option, not an obligation.",
        creator: "6457f3e164e3d6902b4077f9",
      };

      sinon.stub(Post, "findById").returns(fakePost);
      sinon.stub(Post.prototype, "save").throws();

      try {
        const result = await PostController.updatePost(req, {}, () => {});
        expect(result).to.be.an("Error");
        expect(result.statusCode).to.equal(500);
      } finally {
        Post.findById.restore();
        Post.prototype.save.restore();
      }
    });

    it("should return edited post if succeeds", async () => {
      let fakePost = {
        title: "Comment",
        post: "A career is what you do—it doesn’t have to reflect who you are. Making a job part of your identity is an option, not an obligation.",
        creator: "6457f3e164e3d6902b4077f9",
      };

      let res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      sinon.stub(Post, "findById").returns(new Post(fakePost));
      sinon.stub(Post.prototype, "save").returns(fakePost);

      try {
        await PostController.updatePost(req, res, () => {});
        expect(res.status.calledOnceWith(200)).to.be.true;
        expect(
          res.json.calledOnceWith({
            message: "Post edited successfully",
            post: fakePost,
          })
        ).to.be.true;
      } finally {
        Post.findById.restore();
        // Post.prototype.save.restore();
      }
    });
  });

  describe("Delete a Post", () => {
    let req = {
      params: "436876438748763",
    };

    it("should return Error 404 if post not found", async () => {
      sinon.stub(Post, "findById").returns(false);

      try {
        const result = await PostController.deletePost(req, {}, () => {});
        expect(result).to.be.an("Error");
        expect(result).to.have.property("message", "Post to delete not found!");
        expect(result).to.have.property("statusCode", 404);
      } finally {
        Post.findById.restore();
      }
    });

    it("should return Error 500 if error occrus on mongoose funtion", async () => {
      sinon.stub(Post, "findById").throws();

      try {
        const result = await PostController.deletePost(req, {}, () => {});
        expect(result).to.be.an("Error");
        expect(result).to.have.property("statusCode", 500);
      } finally {
        Post.findById.restore();
      }
    });

    it("should return the deleted post after success", async () => {
      let fakePost = {
        title: "Comment",
        post: "A career is what you do—it doesn’t have to reflect who you are. Making a job part of your identity is an option, not an obligation.",
        creator: "6457f3e164e3d6902b4077f9",
      };

      let res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      sinon.stub(Post, "findById").returns(fakePost);
      sinon.stub(User, "findByIdAndUpdate").resolves({});
      sinon.stub(Comment, "find").resolves([]);
      sinon.stub(User, "updateMany").resolves();
      sinon.stub(Post, "findByIdAndDelete").resolves(fakePost);
      sinon.stub(Comment, "deleteMany").resolves();

      try {
        await PostController.deletePost(req, res, () => {});
        expect(res.status.calledOnceWith(200)).to.be.true;
        expect(
          res.json.calledOnceWith({
            message: "Post deleted successfully",
            post: fakePost,
          })
        ).to.be.true;
      } finally {
        Post.findById.restore();
        User.findByIdAndUpdate.restore();
        Comment.find.restore();
        User.updateMany.restore();
        Post.findByIdAndDelete.restore();
        Comment.deleteMany.restore();
      }
    });
  });
});
