const express = require('express');
const isAuth = require('../middleware/is-auth')
const shopController = require('../Controller/shop')
const router = express.Router();

router.post('/allproduct', shopController.postAllProduct)
router.get('/allproduct', shopController.getAllProducts)
router.post('/add-to-cart', isAuth, shopController.addToCart)
router.get('/getcart', isAuth, shopController.getCartItems)
router.post('/increment', isAuth, shopController.increaseQuantity)
router.post('/decrement', isAuth, shopController.decreaseQuantity)
router.post('/createorder', isAuth, shopController.createOrder)
router.post('/getorder',isAuth, shopController.getOrders )
    

module.exports = router;