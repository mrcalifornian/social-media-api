const expect = require("chai").expect;
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middlewares/is-auth");

describe("Auth middleware", () => {
  it("should throw an error if authorization header is missing", () => {
    const req = {
      headers: {},
    };

    expect(() => {
      authMiddleware(req, {}, () => {});
    }).to.throw("Authorization header missing!");
  });

  it("should throw an error if token is missing", () => {
    const req = {
      headers: {
        authorization: "Bearer",
      },
    };

    expect(() => {
      authMiddleware(req, {}, () => {});
    }).to.throw("Token missing!");
  });

  it("should throw an error if token is invalid", () => {
    const req = {
      headers: {
        authorization: "Bearer invalid_token",
      },
    };

    expect(() => {
      authMiddleware(req, {}, () => {});
    }).to.throw();
  });

  it("should set req.userId if token is valid", () => {
    const userId = "abc";
    const token = jwt.sign({ userId }, process.env.JWP);
    const req = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };

    authMiddleware(req, {}, () => {});

    expect(req).to.have.property("userId", userId);
  });
});
