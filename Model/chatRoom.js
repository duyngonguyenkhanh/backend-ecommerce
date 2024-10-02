// models/ChatRoom.js
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // ID của người gửi
  message: { type: String, required: true }, // Nội dung tin nhắn
  timestamp: { type: Date, default: Date.now } // Thời gian gửi
});

const chatRoomSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // ID của người dùng (khách hàng)
  messages: [messageSchema], // Mảng các tin nhắn trong room
});

const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);

module.exports = ChatRoom;
