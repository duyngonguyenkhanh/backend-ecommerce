const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../Model/user");
const Order = require("../Model/order");
const Product = require("../Model/product");

// Secret key để mã hóa JWT
const JWT_SECRET = process.env.JWT_SECRET;
//Hàm đăng ký
exports.postSignupAdmin = [
  async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const phone = req.body.phone;

    if (!email || !password || !phone) {
      return res.status(400).json({ message: "Invalid registration data" });
    }
    try {
      const userExit = await User.findOne({ email: email });
      if (userExit) {
        return res.status(500).json({
          message: "Account already exists, please create another account",
        });
      } else {
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({
          fullname: "admin",
          email: email,
          password: hashedPassword,
          phone: phone,
          role: "admin", // Đặt vai trò là admin
          cart: { items: [] },
        });
        await user.save();
        return res.status(201).json({ message: "Tạo tài khoản thành công" });
      }
    } catch (error) {
      return res.status(500).json({ message: "Tạo tài khoản thất bại" });
    }
  },
];
//Hàm đăng nhập
exports.postLoginAdmin = [
  async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    try {
      const user = await User.findOne({ email: email });

      if (user.role !== "admin" && user.role !== "advisor") {
        return res
          .status(500)
          .json({ message: "Only admin accounts are authorized" });
      }

      if (!user) {
        return res
          .status(500)
          .json({ message: "Sai tài khoản hoặc sai mật khẩu" });
      } else {
        const doMatch = await bcrypt.compare(password, user.password);

        if (doMatch) {
          req.session.isLoggedIn = true;
          req.session.user = user;
          // Nếu mật khẩu đúng, tạo token chứa thông tin người dùng
          const token = jwt.sign(
            {
              userId: user._id,
              email: user.email,
              fullname: user.fullname,
            },
            JWT_SECRET,
            { expiresIn: "1h" } // Token hết hạn sau 1 giờ
          );

          return res.status(200).json({
            message: "Đăng nhập thành công",
            token: token,
          });
        } else {
          return res.status(500).json({ message: "Sai mật khẩu" });
        }
      }
    } catch (error) {
      return res.status(500).json({ message: "Đăng nhập thất bại" });
    }
  },
];

//hàm lấy tất cả order
exports.getAllOrder = async (req, res) => {
  try {
    const order = await Order.find();
    return res.status(200).json({
      message: "lấy dữ liệu thành công",
      order: order,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lấy danh sách đơn hàng thất bại",
      error: error.message,
    });
  }
};

//Hàm logout
exports.postLogout = (req, res, next) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Đăng xuất không thành công." });
      }
      // Xóa cookie liên quan đến session
      //res.clearCookie("connect.sid"); // 'connect.sid' là tên cookie mặc định của express-session
      return res.status(200).json({ message: "Đăng xuất thành công." });
    });
  } else {
    return res.status(400).json({ message: "Không có session để đăng xuất." });
  }
};

//Hàm xóa 1 sản phẩm theo id
exports.deleteProduct = async (req, res) => {
  const productId = req.params.id; // Sửa từ req.parmas thành req.params

  try {
    //Kiểm tra xem sản phẩm có tồn tại hay không?
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "sản phẩm không tồn tại" });
    }

    //Thực hiện việc xóa sản phẩm
    await Product.findByIdAndDelete(productId);
    return res.status(200).json({ message: "Xóa sản phẩm thành công" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Xóa sản phẩm thất bại", error: error.message });
  }
};

// Hàm cập nhật sản phẩm
exports.updateProduct = async (req, res) => {
  const productId = req.params.id;
  const updateProduct = req.body; // Dữ liệu cập nhật từ yêu cầu

  try {
    // Sử dụng findByIdAndUpdate để cập nhật sản phẩm
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updateProduct,
      { new: true }
    );

    // Kiểm tra xem sản phẩm có tồn tại không
    if (!updatedProduct) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }

    return res
      .status(200)
      .json({
        message: "Cập nhật sản phẩm thành công",
        product: updatedProduct,
      });
  } catch (error) {
    return res.status(500).json({
      message: "Cập nhật sản phẩm thất bại",
      error: error.message,
    });
  }
};

//Hàm thêm 1 sản phẩm mới
exports.addProduct = async (req, res) => {
  const {
    category,
    img1,
    img2,
    img3,
    img4,
    long_desc,
    name,
    price,
    short_desc,
  } = req.body;
  try {
    // Tạo một đối tượng sản phẩm mới
    const newProduct = new Product({
      category,
      img1,
      img2,
      img3,
      img4,
      long_desc,
      name,
      price,
      short_desc,
    });

    // Lưu sản phẩm vào cơ sở dữ liệu
    await newProduct.save();

    // Trả về phản hồi khi thêm sản phẩm thành công
    return res.status(201).json({
      message: "Thêm sản phẩm thành công",
      product: newProduct,
    });
  } catch (error) {
    // Trả về phản hồi khi có lỗi
    return res.status(500).json({
      message: "Thêm sản phẩm thất bại",
      error: error.message,
    });
  }
};
