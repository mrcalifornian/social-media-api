const expect = require("chai").expect;
const sinon = require("sinon");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const AuthControler = require("../controllers/auth");

describe("Authentication Controller", () => {
  describe("Signup", () => {
    let req;
    beforeEach(() => {
      req = {
        body: {
          _id: "287498559460",
          name: "Nodir",
          email: "test@mailc.com",
          password: "mypassword",
        },
      };
    });

    it("should throw an error 500 if database access fails", async () => {
      sinon.stub(User, "findOne");
      User.findOne.throws();

      try {
        const result = await AuthControler.signup(req, {}, () => {});
        expect(result).to.be.an("Error");
        expect(result).to.have.property("statusCode", 500);
      } finally {
        User.findOne.restore();
      }
    });

    it("should throw error 403 if user already exist", async () => {
      sinon.stub(User, "findOne").resolves(true);

      try {
        const result = await AuthControler.signup(req, {}, () => {});
        expect(result).to.be.an("Error");
        expect(result).to.have.property("statusCode", 403);
        expect(result).to.have.property("message", "User already exists!");
      } finally {
        User.findOne.restore();
      }
    });

    it("should throw an error 500 if BCRYPT Hash fails", async () => {
      sinon.stub(User, "findOne").resolves(false);
      sinon.stub(bcrypt, "hash").throws("Error");
      try {
        const result = await AuthControler.signup(req, {}, () => {});
        expect(result).to.be.an.instanceOf(Error);
        expect(result).to.have.property("statusCode", 500);
      } finally {
        User.findOne.restore();
        bcrypt.hash.restore();
      }
    });

    it("should throw an error 500 if jwt fails", async () => {
      sinon.stub(User, "findOne").resolves(false);
      sinon.stub(User.prototype, "save").resolves(req.body);
      sinon.stub(jwt, "sign").throws();

      try {
        const result = await AuthControler.signup(req, {}, () => {});
        expect(result).to.be.an.instanceOf(Error);
        expect(result).to.have.property("statusCode", 500);
      } finally {
        User.findOne.restore();
        User.prototype.save.restore();
        jwt.sign.restore();
      }
    });

    it("should return status 201, userId and token if user created successfully", async () => {
      sinon.stub(User, "findOne").resolves(false);
      sinon.stub(User.prototype, "save").returns(req.body);
      sinon.stub(jwt, "sign").returns("token");

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
      const next = sinon.spy();

      await AuthControler.signup(req, res, next);

      try {
        expect(res.status.calledOnceWith(201)).to.be.true;
        expect(
          res.json.calledOnceWith({
            message: "New user created",
            token: "token",
            userId: req.body._id,
          })
        ).to.be.true;
      } finally {
        User.findOne.restore();
        User.prototype.save.restore();
        jwt.sign.restore();
      }
    });
  });

  describe("Login", () => {
    let req, user;

    beforeEach(async () => {
      req = {
        body: {
          email: "mymail@mail.com",
          password: "somepassord",
        },
      };

      user = {
        _id: "12345678",
        email: "mymail@mail.com",
        password: await bcrypt.hash("somepassord", 12),
      };
    });

    it("should throw an error 500 if database access fails", async () => {
      sinon.stub(User, "findOne").throws();

      try {
        const result = await AuthControler.login(req, {}, () => {});
        expect(result).to.be.an("Error");
        expect(result).to.have.property("statusCode", 500);
      } finally {
        User.findOne.restore();
      }
    });

    it("should throw error 404 if user not found", async () => {
      sinon.stub(User, "findOne").returns(false);

      try {
        const result = await AuthControler.login(req, {}, () => {});
        expect(result).to.be.an("Error");
        expect(result).to.have.property("message", "User not found!");
        expect(result).to.have.property("statusCode", 404);
      } finally {
        User.findOne.restore();
      }
    });

    it("should throw an error 401 if password is wrong ", async () => {
      const user = {
        email: "mymail@mail.com",
        password: await bcrypt.hash("wrongpassword", 12),
      };

      sinon.stub(User, "findOne").returns(user);

      try {
        const result = await AuthControler.login(req, {}, () => {});
        expect(result).to.be.an("Error");
        expect(result).to.have.property("message", "Wrong password!");
        expect(result.statusCode).to.equal(401);
      } finally {
        User.findOne.restore();
      }
    });

    it("should throw an error 500 if BCRYPT Compare fails", async () => {
      const euser = {
        email: "mymail@mail.com",
        password: await bcrypt.hash("wrongpassw", 12),
      };

      sinon.stub(User, "findOne").returns(euser);
      sinon.stub(bcrypt, "compare").throws("Error");
      try {
        const result = await AuthControler.login(req, {}, () => {});
        expect(result).to.be.an.instanceOf(Error);
        expect(result).to.have.property("statusCode", 500);
      } finally {
        User.findOne.restore();
        bcrypt.compare.restore();
      }
    });

    it("should throw an error 500 if jwt fails", async () => {
      sinon.stub(User, "findOne").returns(user);
      sinon.stub(jwt, "sign").throws("Error");

      try {
        const result = await AuthControler.login(req, {}, () => {});
        expect(result).to.be.an.instanceOf(Error);
        expect(result).to.have.property("statusCode", 500);
      } finally {
        User.findOne.restore();
        jwt.sign.restore();
      }
    });

    it("should return status 200, userId and token if user created successfully", async () => {
      sinon.stub(User, "findOne").returns(user);
      sinon.stub(bcrypt, "compare").resolves(true);
      sinon.stub(jwt, "sign").returns("token");

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
      const next = sinon.spy();

      try {
        await AuthControler.login(req, res, next);
        expect(res.status.calledOnceWith(200)).to.be.true;
        expect(
          res.json.calledOnceWith({
            token: "token",
            userId: user._id,
          })
        ).to.be.true;
      } finally {
        User.findOne.restore();
        jwt.sign.restore();
      }
    });
  });
});
