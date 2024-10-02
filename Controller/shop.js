const Product = require("../Model/product");

const User = require("../Model/user");

const Order = require("../Model/order");
require('dotenv').config();
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");

exports.postAllProduct = [
  async (req, res, next) => {
    try {
      const newProduct = new Product({
        category: "airpod",
        img1: "https://firebasestorage.googleapis.com/v0/b/funix-way.appspot.com/o/xSeries%2FCCDN%2FReactJS%2FAssignment_Images%2FASM03_Resources%2Fairpod_1_1.jpeg?alt=media&token=33b2ebdd-086c-4b8e-9241-0b566ca66754",
        img2: "https://firebasestorage.googleapis.com/v0/b/funix-way.appspot.com/o/xSeries%2FCCDN%2FReactJS%2FAssignment_Images%2FASM03_Resources%2Fairpod_1_2.jpeg?alt=media&token=b6201728-3058-489e-aa49-df59c4255833",
        img3: "https://firebasestorage.googleapis.com/v0/b/funix-way.appspot.com/o/xSeries%2FCCDN%2FReactJS%2FAssignment_Images%2FASM03_Resources%2Fairpod_1_4.jpeg?alt=media&token=cb5d7f1f-03a2-409a-8ee9-1783b37e6b56",
        img4: "https://firebasestorage.googleapis.com/v0/b/funix-way.appspot.com/o/xSeries%2FCCDN%2FReactJS%2FAssignment_Images%2FASM03_Resources%2Fairpod_1_3.jpeg?alt=media&token=3c036bd6-b76a-48a7-8cd2-a58290cd1763",
        long_desc: "Đặc điểm nổi bật...",
        name: "Apple AirPods 3rd gen",
        price: 4390000,
        short_desc: "Thiết kế sang trọng, nhiều thay đổi...",
      });

      newProduct
        .save()
        .then(() => console.log("Product saved!"))
        .catch((err) => console.error("Error saving product:", err));
    } catch (error) {
      console.log(error);
    }
  },
];

// Controller để lấy tất cả sản phẩm
exports.getAllProducts = async (req, res, next) => {
  try {
    const products = await Product.find(); // Truy vấn tất cả sản phẩm
    res.status(200).json(products); // Trả về danh sách sản phẩm dưới dạng JSON
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

//Controller thực hiện việc thêm cart
exports.addToCart = async (req, res, next) => {
  const userId = req.user._id; // Giả sử bạn lưu ID người dùng trong req.user sau khi xác thực
  const { productId, quantity } = req.body; // Nhận ID sản phẩm và số lượng từ body yêu cầu

  try {
    // Tìm người dùng theo ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Tìm sản phẩm theo ID
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Thêm sản phẩm vào giỏ hàng với số lượng
    await user.addToCart(product, quantity);

    res.status(200).json({ message: "Product added to cart" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Controller lấy tất cả sản phẩm trong giỏ hàng
exports.getCartItems = async (req, res) => {
  try {
    // Lấy thông tin người dùng hiện tại (có thể từ token hoặc session)
    const userId = req.user._id; // Bạn cần xác định logic lấy userId
    const user = await User.findById(userId).populate("cart.items.productId");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const cartItems = user.cart.items.map((item) => ({
      id: item.productId._id,
      name: item.productId.name,
      image: item.productId.img1,
      price: item.productId.price,
      quantity: item.quantity,
    }));

    res.status(200).json({ cartItems });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Controller tăng số lượng sản phẩm trong giỏ hàng
exports.increaseQuantity = async (req, res, next) => {
  const productId = req.body.productId; // Lấy productId từ request body
  const userId = req.user._id; // Bạn cần xác định logic lấy userId

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Tăng số lượng sản phẩm trong giỏ hàng
    await user.updateCartQuantity(productId, 1); // Tăng 1 sản phẩm

    return res.status(200).json({ message: "Product quantity increased" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Something went wrong", error: err });
  }
};
// Controller giảm số lượng sản phẩm trong giỏ hàng
exports.decreaseQuantity = async (req, res, next) => {
  const productId = req.body.productId; // Lấy productId từ request body
  const userId = req.user._id; // Bạn cần xác định logic lấy userId

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Giảm số lượng sản phẩm trong giỏ hàng
    await user.updateCartQuantity(productId, -1); // Giảm 1 sản phẩm

    return res.status(200).json({ message: "Product quantity decreased" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Something went wrong", error: err });
  }
};

// Controller để tạo đơn hàng
exports.createOrder = async (req, res) => {
  const { products, fullname, email, phone, address } = req.body;
  const userId = req.user._id;

  try {
    // Lấy thông tin user từ User model
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Tạo đơn hàng mới từ products và thông tin user
    const order = new Order({
      products: products.map((product) => ({
        product: product,
        quantity: product.quantity,
      })),
      user: {
        userId: userId,
        fullname: fullname,
        email: email,
        phone: phone,
        address: address,
      },
    });

    // Lưu đơn hàng vào cơ sở dữ liệu
    await order.save();

    // Làm sạch giỏ hàng của user sau khi order đã lưu thành công
    await user.clearCart();

    // Tạo transporter để gửi email qua Gmail
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL, // Tài khoản Gmail của bạn
        pass: process.env.PASSWORD, // Mật khẩu ứng dụng Gmail
      },
    });

    // Cấu hình nội dung email xác nhận đơn hàng
    let mailOptions = {
      from: "ecommerceapp61@gmail.com",
      to: email,
      subject: "Order Confirmation",
      html: `
       <div>
  <h1>Xin chào ${fullname}</h1>
  <p style="margin-top: 20px; margin-bottom: 20px;"> số điện thoại: ${phone}</p>
  <p style="margin-top: 20px; margin-bottom: 20px;"> Địa chỉ ${address}</p>
 <div style="display: flex; width: 700px; border: 2px solid black;">
        <p style="width: 20%; border-right: 2px solid black; margin-top: 0; margin-bottom: 0; text-align: center;">Tên sản phẩm</p>
        <p style="width: 20%; border-right: 2px solid black; margin-top: 0; margin-bottom: 0; text-align: center;">Hình ảnh</p>
        <p style="width: 20%; border-right: 2px solid black; margin-top: 0; margin-bottom: 0; text-align: center;">Giá</p>
        <p style="width: 20%; border-right: 2px solid black; margin-top: 0; margin-bottom: 0; text-align: center;">Số lượng</p>
        <p style="width: 20%; border-right: 2px solid black; margin-top: 0; margin-bottom: 0; text-align: center">Thành tiền</p>
      </div>
  ${products
    .map(
      (item) => `
     <div style="display: flex; border: 2px solid black; width: 700px">
        <p style="width: 20%; border-right: 2px solid black; margin-top: 0; margin-bottom: 0;">${item.name}</p>
        <div
          style="
            width: 20%;
            display: flex;
            justify-content: center;
            border-right: 2px solid black;
            align-items: center;
            flex-direction: column;
          "
        >
          <img
            style="
              width: 90%;
              height: auto;
              text-align: center;
              object-fit: cover;
              
            "
            src="${item.image}"
            alt=""
          />
        </div>
        <p style="width: 20%; text-align: center ; border-right: 2px solid black; margin-top: 0; margin-bottom: 0;">
          ${(item.price).toLocaleString("vi-VN")} VND
        </p>
        <p style="width: 20%; text-align: center; border-right: 2px solid black; margin-top: 0; margin-bottom: 0;">${item.quantity}</p>
        <p style="width: 20%; text-align: center">
          ${Number(item.price * item.quantity).toLocaleString("vi-VN")} VND
        </p>
      </div>
  `
    )
    .join("")}
  <p style="margin-top: 20px; margin-bottom: 20px;">${products
    .reduce(
      (total, item) => total + Number(item.price) * Number(item.quantity),
      0
    )
    .toLocaleString("vi-VN")} VND: </p>
  <p style="margin-top: 20px; margin-bottom: 20px;">Cảm ơn bạn đã đặt hàng!!</p>
</div>
`,
    };

    try {
      // Gửi email
      await transporter.sendMail(mailOptions);
      console.log("successful");
    } catch (error) {
      console.error("Error sending email:", error);
    }

    // Phản hồi thành công sau khi email đã được gửi
    return res
      .status(201)
      .json({ message: "Order created successfully and email sent", order });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Controller để lấy tất cả order của 1 user
exports.getOrders = async (req, res) => {
  try {
    // Lấy thông tin người dùng hiện tại từ token hoặc session
    const userId = req.user._id; // Bạn cần xác định logic lấy userId

    // Tìm tất cả các đơn hàng của người dùng
    const userOrders = await Order.find({ "user.userId": userId });

    if (!userOrders || userOrders.length === 0) {
      return res.status(404).json({ message: "No orders found for this user" });
    }

    res.status(200).json({ orders: userOrders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};
