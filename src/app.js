import express from 'express'
import cookieParser from 'cookie-parser'; 
import  cors from 'cors'
import userRouter from './routes/auth.routes.js'
import foodRouter from './routes/food.routes.js'
import cartRouter from './routes/cart.routes.js'
import orderRouter from './routes/order.routes.js'
import 'dotenv/config';

const app = express()
app.use(cors({
  origin : process.env.FRONT_URL,
  credentials : true,
  methods : ['GET' , 'POST' , 'PUT' , 'DELETE'],
  // allowedHeaders : ['Content-Type' , 'Authorization']
}))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.use('/user' , userRouter)
app.use('/food' , foodRouter)
app.use('/cart' , cartRouter)
app.use('/order' , orderRouter)

export default app

//work on create food 