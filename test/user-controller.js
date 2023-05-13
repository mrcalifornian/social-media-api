const expect = require("chai").expect;
const sinon = require("sinon");

const UserController = require("../controllers/user");
const User = require("../models/user");

describe("User Controller", () => {
  describe("Get user data", () => {
    const req = {
      params: {
        userId: "76327987387698",
      },
    };

    it("should throw error 404 if user not found", async () => {
      sinon.stub(User, "findById").returns({
        select: sinon.stub().returnsThis(),
        populate: sinon.stub().returns(false),
      });

      try {
        const error = await UserController.getUser(req, {}, () => {});
        expect(error).to.be.an("Error");
        expect(error).to.be.have.property("message", "Invalid user ID!");
        expect(error).to.be.have.property("statusCode", 404);
      } finally {
        User.findById.restore();
      }
    });

    it("should throw error 500 if internal server error occurs", async () => {
      sinon.stub(User, "findById").returns({
        select: sinon.stub().returnsThis(),
        populate: sinon.stub().throws(),
      });

      try {
        const error = await UserController.getUser(req, {}, () => {});
        expect(error).to.be.an("Error");
        expect(error).to.be.have.property("statusCode", 500);
      } finally {
        User.findById.restore();
      }
    });

    it("should return the user data if succeeds", async () => {
      let res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      let userData = {
        name: "Nodir",
        email: "nodir@mail.com",
      };
      sinon.stub(User, "findById").returns({
        select: sinon.stub().returnsThis(),
        populate: sinon.stub().returns(userData),
      });

      try {
        const error = await UserController.getUser(req, res, () => {});
        if (error) {
          console.log(error);
        }

        expect(res.status.calledOnceWith(200)).to.be.true;
        expect(res.json.calledOnceWith(userData)).to.be.true;
      } finally {
        User.findById.restore();
      }
    });
  });
});
