const express = require("express");
require('dotenv').config();
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session); // Gắn session với MongoDB
const app = express();
const PORT = process.env.PORT;

//import các model
const User = require("./Model/user");

//import các router
const shopRouter = require("./Router/shop");
const userRouter = require("./Router/user");
const adminRouter = require("./Router/admin");

const MONGODB_URI =
  "mongodb+srv://duyngonguyenkhanh:reyt3clSrRT1l5iI@cluster0.mqoq6.mongodb.net/ecommerce-app";

//Tạo store để lưu trữ session
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "session",
});
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toDateString() + "-" + file.originalname);
  },
});

const fileFillter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
// Middleware để xử lý JSON
app.use(express.json());
// Áp dụng Multer middleware cho việc upload file
app.use(
  multer({ storage: fileStorage, fileFilter: fileFillter }).single("image")
);
app.use("/images", express.static(path.join(__dirname, "images")));

// Cấu hình CORS để chỉ định rõ ràng miền của Frontend và cho phép gửi cookie
app.use(
  cors({
    origin: true, // Địa chỉ của Frontend
    credentials: true, // Cho phép gửi cookie
  })
);

//Cấu hình session
app.use(
  session({
    secret: "my secret", // Chuỗi bí mật để mã hóa session
    resave: false, // Không lưu lại session nếu không thay đổi
    saveUninitialized: false, // Không lưu session khi không có thay đổi
    store: store, // Nơi lưu session (ở đây là MongoDB)
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // Thời gian hết hạn của session (1 ngày)
      httpOnly: true, // Chỉ gửi cookie qua HTTP(S), không truy cập từ JavaScript
      secure: false, // Đặt thành true nếu dùng HTTPS
    },
  })
);

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  //  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      console.log(user);

      req.user = user;
      next();
    })
    .catch((err) => next(err));
});

// Tạo route cơ bản
app.get("/", (req, res) => {
  res.send("Chào mừng bạn đến với Backend Node.js!");
});

app.use("/product", shopRouter);
app.use("/auth", userRouter);
app.use("/admin", adminRouter);

//kết nối với mongodb
mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    app.listen(PORT);
  })
  .catch((err) => {
    console.error(err);
  });
