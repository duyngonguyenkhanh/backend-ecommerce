
module.exports = (req, res, next) => {
    // Kiểm tra nếu người dùng chưa đăng nhập
    if (!req.session.isLoggedIn) {
      return res.status(400).json({ message: "Bạn chưa đăng nhập" });
    }
  
    // Kiểm tra nếu người dùng không phải là admin
    if (req.session.user.role !== 'admin') {
      return res.status(403).json({ message: "Quyền truy cập bị từ chối. Chỉ admin mới có quyền truy cập." });
    }
  
    // Nếu là admin, cho phép tiếp tục
    next();
  };
  