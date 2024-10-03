const ChatRoom = require("../Model/chatRoom");

// Controller để tạo phòng chat giữa admin và client
exports.createRoom = async (req, res) => {
  const { adminId, clientId } = req.body;

  try {
    // Kiểm tra xem phòng đã tồn tại chưa
    let room = await ChatRoom.findOne({ users: { $all: [adminId, clientId] } });
    if (!room) {
      // Nếu chưa tồn tại, tạo phòng mới
      room = new ChatRoom({
        users: [adminId, clientId], // Lưu adminId và clientId vào users
        messages: [], // Khởi tạo mảng tin nhắn trống
      });
      await room.save();
    }
    res.status(201).json({ roomId: room._id });
  } catch (error) {
    res.status(500).json({ message: "Tạo phòng chat thất bại", error });
  }
};

// Controller để lấy danh sách tất cả các phòng chat
exports.getAllRooms = async (req, res) => {
  try {
    // Lấy tất cả các phòng chat
    const rooms = await ChatRoom.find();

    // Kiểm tra xem có phòng nào không
    if (rooms.length === 0) {
      return res.status(404).json({ message: "Không có phòng chat nào" });
    }

    // Gửi danh sách phòng chat về client
    res.status(200).json(rooms);
  } catch (error) {
    console.error(error); // In ra lỗi để dễ dàng kiểm tra
    res.status(500).json({ message: "Lấy danh sách phòng chat thất bại", error });
  }
};

// Controller để lấy tin nhắn trong phòng chat
exports.getMessages = async (req, res) => {
  const { roomId } = req.params;

  try {
    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Phòng chat không tồn tại" });
    }
    res.status(200).json(room.messages);
  } catch (error) {
    res.status(500).json({ message: "Lấy tin nhắn thất bại", error });
  }
};

// Controller để gửi tin nhắn
exports.sendMessage = async (req, res) => {
  const { roomId, userId, message } = req.body;

  try {
    // Tìm phòng chat theo roomId
    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Phòng chat không tồn tại" });
    }

    // Thêm tin nhắn vào phòng chat
    room.messages.push({ userId, message });
    await room.save(); // Lưu phòng chat đã cập nhật vào database

    res.status(200).json({ message: "Tin nhắn đã được gửi" });
  } catch (error) {
    console.error(error); // In ra lỗi để dễ dàng kiểm tra
    res.status(500).json({ message: "Gửi tin nhắn thất bại", error });
  }
};

// Controller để gửi tin nhắn từ admin đến client
exports.sendAdminMessage = async (req, res) => {
  const { roomId, adminId, message } = req.body;

  try {
    // Tìm phòng chat theo roomId
    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Phòng chat không tồn tại" });
    }

    // Thêm tin nhắn của admin vào phòng chat
    room.messages.push({ userId: adminId, message });
    await room.save(); // Lưu phòng chat đã cập nhật vào database

    // Phát sự kiện gửi tin nhắn đến client qua socket.io
    req.io.to(roomId).emit("message", { userId: adminId, message }); // Gửi tin nhắn đến tất cả người dùng trong phòng

    res.status(200).json({ message: "Tin nhắn đã được gửi từ admin" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gửi tin nhắn thất bại", error });
  }
};

// Controller để gửi tin nhắn từ client đến admin
exports.sendClientMessage = async (req, res) => {
  const { roomId, clientId, message } = req.body;

  try {
    // Tìm phòng chat theo roomId
    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Phòng chat không tồn tại" });
    }

    // Thêm tin nhắn của client vào phòng chat
    room.messages.push({ userId: clientId, message });
    await room.save(); // Lưu phòng chat đã cập nhật vào database

    // Phát sự kiện gửi tin nhắn đến admin qua socket.io
    req.io.to(roomId).emit("message", { userId: clientId, message }); // Gửi tin nhắn đến admin

    res.status(200).json({ message: "Tin nhắn đã được gửi đến admin" });
  } catch (error) {
    console.error(error); // In ra lỗi để dễ dàng kiểm tra
    res.status(500).json({ message: "Gửi tin nhắn thất bại", error });
  }
};
