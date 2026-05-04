import express from 'express'

const router = express.Router()
import {userAuth} from '../middleware/auth.middleware.js';
import { 
    createUser , loginUser , logoutUser, fetchUserById,
    registerFoodPatner , loginFoodPartner , logoutFoodPartner , fetchPatnerByid
} from '../controllers/auth.controller.js'

router.post('/register' , createUser)
router.post('/login' , loginUser)
router.get('/logout' , logoutUser)



// user ^

router.post('/register-food-partner' , registerFoodPatner)
router.post('/login-food-partner' , loginFoodPartner)
router.get('/logout-food-partner' , logoutFoodPartner)
router.get('/food-partner/:id' , fetchPatnerByid)

// food partner ^
export default router