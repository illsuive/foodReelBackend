import express from 'express'

const router = express.Router()
import { userAuth  ,  foodPartnerAuth} from '../middleware/auth.middleware.js'

import {CreateOrder , VerifyPayment , GetOrders , getOrderBypatner , getOrderByUser} from '../controllers/order.controller.js'

router.post('/create' , userAuth ,  CreateOrder)
router.post('/verify' , userAuth ,  VerifyPayment)
router.get('/my-orders', userAuth , GetOrders);
router.get('/food-partner/:id' , foodPartnerAuth ,  getOrderBypatner) 
router.get('/user-orders' , userAuth , getOrderByUser)

export default router