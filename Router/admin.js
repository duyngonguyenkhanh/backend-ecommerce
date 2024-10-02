const express = require('express');
const isAdmin = require('../middleware/is-admin')
const adminController = require('../Controller/admin')
const router = express.Router();

router.post('/signupadmin', adminController.postSignupAdmin)

router.post('/loginadmin', adminController.postLoginAdmin)

router.post('/logoutadmin', adminController.postLogout)

router.post('/getallorder',isAdmin , adminController.getAllOrder)

router.delete('/products/:id',isAdmin , adminController.deleteProduct)

router.post('/updateproduct/:id',isAdmin , adminController.updateProduct)

    

module.exports = router;