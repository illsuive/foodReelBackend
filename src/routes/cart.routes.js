import express from 'express'

const router = express.Router()
import { userAuth } from '../middleware/auth.middleware.js'

import {  AddToCart , ReduceQuantity , RemoveFromCart , ClearCart , IncreaseQuantity , GetCart}   from '../controllers/foodCart.controller.js'

router.post('/add' , userAuth ,  AddToCart)
router.post('/reduce' , userAuth ,  ReduceQuantity)
router.post('/increase' , userAuth ,  IncreaseQuantity)
router.post('/remove' , userAuth ,  RemoveFromCart)
router.get('/clear' , userAuth ,  ClearCart)
router.get('/get' , userAuth ,  GetCart)

export default router