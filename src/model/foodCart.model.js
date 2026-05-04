import mongoose from "mongoose";

const foodCartSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true }, // One cart per user
    items: [
        {
            foodId: { type: mongoose.Schema.Types.ObjectId, ref: "Food", required: true },
            foodPartner : { type: mongoose.Schema.Types.ObjectId, ref: "FoodPartner", required: true },
            name: { type: String, required: true },
            quantity: { type: Number, default: 1, min: [1, 'Quantity cannot be less than 1'] },
            price: { type: Number, required: true }
        }
    ],
    totalPrice: { type: Number, default: 0 }
}, { timestamps: true });

const FoodCart = mongoose.model("FoodCart" , foodCartSchema)

export default FoodCart;