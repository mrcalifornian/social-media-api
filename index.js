const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const PORT = process.env.PORT;
const DB_URL = process.env.MONGODB;

const authRouter = require("./routes/auth");
const postRouter = require("./routes/post");
const commentRouter = require("./routes/comment");
const userRouter = require("./routes/user");
const notFound = require("./routes/404");

const check_auth = require("./middlewares/is-auth");
const limiter = require("./middlewares/rate-limit");

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use("/auth", authRouter);
app.use("/users", check_auth, limiter, userRouter);
app.use("/posts", check_auth, limiter, postRouter);
app.use("/comments", check_auth, limiter, commentRouter);
app.use(notFound);

app.use((error, req, res, next) => {
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

mongoose
  .connect(DB_URL)
  .then(() => {
    console.log("DB Connected");
    app.listen(PORT, () => {
      console.log(`Server's running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
