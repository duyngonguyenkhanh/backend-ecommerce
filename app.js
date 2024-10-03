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

const io = require("socket.io")(server, {
  cors: {
    origin: true, // Địa chỉ của frontend React
    methods: ["GET", "POST"],
    credentials: true, // Cho phép gửi cookie hoặc xác thực
  },
}); // Khởi tạo socket.io

const PORT = process.env.PORT;

//import các model
const User = require("./Model/user");

//import các router
const shopRouter = require("./Router/shop");
const userRouter = require("./Router/user");
const adminRouter = require("./Router/admin");
const chatRouter = require("./Router/chat");

//import modelchat
const ChatRoom = require('./Model/chatRoom')
const UserModal = require('./Model/user')
const chatController = require('./Controller/chat')

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

// Middleware để sử dụng socket.io trong req
app.use((req, res, next) => {
  req.io = io; // Gán io vào req
  next();
});

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
      secure: process.env.NODE_ENV === "production", // Chỉ bật secure trên môi trường production
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // 'none' trên production, 'lax' trên local
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

// Socket.IO logic cho tính năng chat live
// Danh sách phòng chat
let rooms = {}; // Lưu thông tin các phòng

// Xử lý kết nối của client
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Client tham gia một phòng dựa trên userId (ví dụ userId được truyền khi kết nối)
  socket.on('joinRoom', ({ roomId, userId }) => {
    socket.join(roomId);
    console.log(`${userId} joined room ${roomId}`);
    
    // Cập nhật danh sách các phòng với thông tin client
    rooms[roomId] = { roomId, userId };
    
    // Phát lại danh sách phòng cho tất cả admin
    io.emit('rooms', Object.keys(rooms)); // Phát danh sách phòng cho admin
  });

  // Lắng nghe và phát tin nhắn tới phòng
  socket.on('message', ({ roomId, message, userId }) => {
    io.to(roomId).emit('message', { userId, message });
  });

  // Xử lý ngắt kết nối
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Loại bỏ phòng khi client thoát (có thể thêm logic tùy chỉnh)
    for (const room in rooms) {
      if (rooms[room].userId === socket.id) {
        delete rooms[room];
      }
    }
    io.emit('rooms', Object.keys(rooms)); // Phát lại danh sách phòng sau khi client thoát
  });
});

// Kết nối với MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server đang chạy trên cổng ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(err);
  });
