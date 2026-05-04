import express from "express"
const router = express.Router()
import multer from 'multer'
import {
    createFood , fetchAllFoods , deleteFood , UpdateFood , HandleLikeFood
} from '../controllers/food.controller.js'
import { foodPartnerAuth  , userAuth,} from '../middleware/auth.middleware.js'

const upload = multer({
    storage: multer.memoryStorage(),

})

router.post('/upload', foodPartnerAuth, upload.single('video'), createFood)
router.get('/all' , userAuth, fetchAllFoods)
router.delete('/delete/:id', foodPartnerAuth, deleteFood)
router.put('/update/:id', foodPartnerAuth, upload.single('video'), UpdateFood)
router.post('/like-food' , userAuth, HandleLikeFood)

export default router