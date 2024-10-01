const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  fullname: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['customer', 'advisor', 'admin'], // Chỉ chấp nhận các giá trị này
    default: 'customer' // Mặc định là "customer" nếu không được chỉ định
  },  
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        quantity: { type: Number, required: true }
      }
    ]
  }
});

// Phương thức thêm sản phẩm vào giỏ hàng
userSchema.methods.addToCart = function(product, quantity) {
  const cartProductIndex = this.cart.items.findIndex(cp => {
    return cp.productId.toString() === product._id.toString();
  });

  let updatedCartItems = [...this.cart.items];

  if (cartProductIndex >= 0) {
    // Cập nhật số lượng sản phẩm nếu sản phẩm đã có trong giỏ hàng
    updatedCartItems[cartProductIndex].quantity += quantity;
  } else {
    // Thêm sản phẩm mới vào giỏ hàng
    updatedCartItems.push({
      productId: product._id,
      quantity
    });
  }

  this.cart.items = updatedCartItems;
  return this.save();
};

// Phương thức giảm hoặc tăng số lượng sản phẩm trong giỏ hàng
userSchema.methods.updateCartQuantity = function(productId, delta) {
  const cartProductIndex = this.cart.items.findIndex(cp => {
    return cp.productId.toString() === productId.toString();
  });

  if (cartProductIndex >= 0) {
    let currentQuantity = this.cart.items[cartProductIndex].quantity;
    currentQuantity += delta; // delta có thể là +1 (tăng) hoặc -1 (giảm)

    if (currentQuantity > 0) {
      // Cập nhật số lượng nếu vẫn còn số lượng
      this.cart.items[cartProductIndex].quantity = currentQuantity;
    } else {
      // Xóa sản phẩm khỏi giỏ hàng nếu số lượng <= 0
      this.cart.items.splice(cartProductIndex, 1);
    }
  }

  return this.save();
};

// Phương thức xóa sản phẩm khỏi giỏ hàng
userSchema.methods.removeFromCart = function(productId) {
  const updatedCartItems = this.cart.items.filter(item => {
    return item.productId.toString() !== productId.toString();
  });
  this.cart.items = updatedCartItems;
  return this.save();
};

// Phương thức làm sạch giỏ hàng
userSchema.methods.clearCart = function() {
  this.cart = { items: [] };
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
