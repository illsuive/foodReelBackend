import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food', required: true },
        foodPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodPartner', required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true }
    }],
    status: { 
        type: String, 
        enum: ['Pending', 'Paid', 'Failed'], 
        default: 'Pending' 
    },
    totalPrice: { type: Number, required: true },
    shipping : {type : String , required : true},
    razorPay_order_id: { type: String, required: true },
    razorPay_payment_id: { type: String, required: true },
    razorPay_signature: { type: String, required: true },
}, {
    timestamps: true,
});

const Order = mongoose.model('Order', orderSchema);

export default Order;