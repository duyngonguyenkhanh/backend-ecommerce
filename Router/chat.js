const express = require("express");
const chatController = require("../Controller/chat"); // Import controller
const router = express.Router();

// API để tạo phòng chat giữa admin và client
router.post("/createRoom", chatController.createRoom);

// API để tạo phòng chat giữa admin và client
router.post("/getrooms", chatController.getAllRooms);

// API để lấy tin nhắn trong phòng chat
router.get("/messages/:roomId", chatController.getMessages);

// Route để gửi tin nhắn
router.post("/sendMessage", chatController.sendMessage);

// Route để gửi tin nhắn từ admin
router.post("/sendAdminMessage", chatController.sendAdminMessage);

// Route để gửi tin nhắn từ client
router.post("/sendClientMessage", chatController.sendClientMessage);

module.exports = router;
