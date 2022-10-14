const express = require('express')
const controller = require('../controllers/product.controller')
const keyVerify = require('../middlewares/keyCheck')
const loginVerify = require('../middlewares/loginCheck')

const router = express.Router()
router.route('/create').post(keyVerify, loginVerify, controller.productCreate)
router.route('/update').post(keyVerify, loginVerify, controller.productUpdate)
router.route('/list').get(keyVerify, loginVerify, controller.productList)
router.route('/order').get(keyVerify, loginVerify, controller.orderDetails)
module.exports = router
