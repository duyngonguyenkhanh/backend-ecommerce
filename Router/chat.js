// routes/chat.js
const express = require("express");
const router = express.Router();
const ChatRoom = require("../Model/chatRoom"); // Mô hình ChatRoom

// Tạo một room chat mới
router.post("/rooms", async (req, res) => {
  const { userId } = req.body; // ID của người dùng
  try {
    const newRoom = await ChatRoom.create({ userId, messages: [] });
    res.status(201).json(newRoom);
  } catch (error) {
    res.status(500).json({ message: "Tạo room không thành công", error });
  }
});

// Lấy danh sách các room chat
router.get("/rooms", async (req, res) => {
  try {
    const rooms = await ChatRoom.find();
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: "Lấy danh sách room không thành công", error });
  }
});

module.exports = router;
