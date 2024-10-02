const express = require("express");
const http = require("http"); // Import http
const socketIo = require("socket.io"); // Import socket.io
require("dotenv").config();
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session); // Gắn session với MongoDB
const app = express();
const server = http.createServer(app); // Tạo server http
const io = socketIo(server); // Khởi tạo socket.io
const PORT = process.env.PORT;

//import các model
const User = require("./Model/user");

//import các router
const shopRouter = require("./Router/shop");
const userRouter = require("./Router/user");
const adminRouter = require("./Router/admin");
const chatRouter = require("./Router/chat");

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

app.set("trust proxy", 1); // Bật trust proxy để cookie hoạt động trên Render


//Cấu hình session
app.use(
  session({
    secret: "my secret", // Chuỗi bí mật để mã hóa session
    resave: false, // Không lưu lại session nếu không thay đổi
    saveUninitialized: false, // Không lưu session khi không có thay đổi
    store: store, // Nơi lưu session (ở đây là MongoDB)
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // Thời gian hết hạn của session (1 ngày)
      httpOnly: true, // Chỉ gửi cookie qua HTTP(S), không truy cập từ JavaScript
      secure: process.env.NODE_ENV === 'production', // Chỉ bật secure trên môi trường production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' // 'none' trên production, 'lax' trên local
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
app.use("/chat", chatRouter);

io.on("connection", (socket) => {
  console.log("Người dùng kết nối:", socket.id);

  // Lắng nghe sự kiện "message" từ client
  socket.on("message", async (data) => {
    const { roomId, message, userId } = data;

    // Lưu tin nhắn vào database (cập nhật room)
    await ChatRoom.findByIdAndUpdate(roomId, {
      $push: { messages: { userId, message } },
    });

    // Phát sự kiện đến các người dùng khác trong room
    socket.to(roomId).emit("message", { message, userId });
  });

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
  });

  socket.on("disconnect", () => {
    console.log("Người dùng đã ngắt kết nối:", socket.id);
  });
});
//kết nối với mongodb
mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    app.listen(PORT);
  })
  .catch((err) => {
    console.error(err);
  });
