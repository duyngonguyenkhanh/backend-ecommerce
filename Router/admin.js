const express = require('express');
const isAuth = require('../middleware/is-auth')
const adminController = require('../Controller/admin')
const router = express.Router();

router.post('/signupadmin', adminController.postSignupAdmin)

router.post('/loginadmin', adminController.postLoginAdmin)

router.post('/logoutadmin', adminController.postLogout)

    

module.exports = router;