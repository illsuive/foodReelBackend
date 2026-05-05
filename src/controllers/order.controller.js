import RazorpayInstance from '../razorpay/razorPayConfig.js';
import Order from '../model/foodOrder.js';
import User from '../model/user.model.js';
import FoodPartner from '../model/foodPatner.model.js';
import 'dotenv/config';
import crypto from 'crypto';

const formatOrderItems = (order) => {
    const groupedByPartner = order.items.reduce((acc, item) => {
        const partnerId = item.foodPartner?.toString();
        const foodData = item.foodId; 
        const partnerDetails = foodData?.foodPartner;

        if (!acc[partnerId]) {
            acc[partnerId] = {
                foodPartnerId: partnerId,
                restaurantName: partnerDetails?.restaurant || "Restaurant",
                partnerSubtotal: 0,
                items: []
            };
        }

        acc[partnerId].items.push({
            ...item._doc, 
            video: foodData?.video, 
            description: foodData?.description 
        });

        acc[partnerId].partnerSubtotal += item.price * item.quantity;
        return acc;
    }, {});

    return {
        _id: order._id,
        totalAmount: order.totalPrice,
        shipping: order.shipping,
        status: order.status,
        createdAt: order.createdAt,
        razorPay_order_id: order.razorPay_order_id,
        groupedItems: Object.values(groupedByPartner)
    };
};

// format 

export const CreateOrder = async (req, res) => {
    try {
        const { _id } = req.user;
        
        const { items, totalPrice, shipping} = req.body;
        
        if (!items || items.length === 0 || !totalPrice || !shipping) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
       
        const options = {
            amount: Number(totalPrice) * 100, 
            currency: "INR",
            receipt: `receipt_order_${Date.now()}`,
        };

        const razorpayOrder = await RazorpayInstance.orders.create(options);
        
        if (!razorpayOrder) {
            return res.status(500).json({ message: 'Razorpay order creation failed' });
        }

        const order = await Order.create({
            user: _id,
            items,
            totalPrice,
            shipping,
            razorPay_order_id: razorpayOrder.id,
            razorPay_payment_id: "pending", 
            razorPay_signature: "pending"
        });

        res.status(201).json({ 
            success: true, 
            message: 'Order initialized', 
            order, 
            key_id: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error("Order Error:", error);
        res.status(500).json({ message: 'Error creating order', error: error.message });
    }
};

export const VerifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            const updatedOrder = await Order.findOneAndUpdate(
                { razorPay_order_id: razorpay_order_id },
                { 
                    razorPay_payment_id: razorpay_payment_id, 
                    razorPay_signature: razorpay_signature, 
                    status: "Paid" 
                },
                { new: true } 
            );

            if (!updatedOrder) {
                return res.status(404).json({ success: false, message: "Order not found" });
            }

            const user = await User.findById(updatedOrder.user);
            if (user) {
                user.orders.push(updatedOrder._id);
                await user.save();
            }

            const partnerIds = [...new Set(updatedOrder.items.map(item => item.foodPartner.toString()))];

            await FoodPartner.updateMany(
                { _id: { $in: partnerIds } },
                { $addToSet: { customers: updatedOrder.user } }
            );
            
            return res.status(200).json({ 
                success: true, 
                message: "Payment verified and Partners updated", 
                order: updatedOrder 
            });
        } else {
            return res.status(400).json({ success: false, message: "Invalid payment signature" });
        }
    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ success: false, message: "Error verifying payment", error: error.message });
    }
}

export const GetOrders = async (req, res) => {
    try {
        const { _id } = req.user;  
        
        const rawOrders = await Order.find({ user: _id })
            .populate({
                path: 'items.foodId', 
                populate: { path: 'foodPartner' } 
            })
            .sort({ createdAt: -1 });
    
        if (!rawOrders || rawOrders.length === 0) {
            return res.status(200).json({ message: "No orders found", orders: [], success: true });
        }

        const formattedOrders = rawOrders.map(order => formatOrderItems(order));
        
        return res.status(200).json({ 
            message: "Orders fetched successfully", 
            orders: formattedOrders, 
            success: true 
        });
    } catch (error) {
        return res.status(500).json({ message: error.message, success: false });
    }
}

export const getOrderByUser = async (req, res) => {
    try {
        const { _id } = req.user;
        const user = await User.findById(_id).populate('orders')
        .populate({
            path: 'orders.items.foodId',
            populate: { path: 'foodPartner' }
        })
        .sort({ createdAt: -1 });
        if (!user) {
            return res.status(404).json({ message: "User not found", success: false });
        }
        const orders = user.orders.map(order => formatOrderItems(order));
        return res.status(200).json({ message: "User orders fetched successfully", orders, success: true });
    } catch (error) {
        return res.status(500).json({ message: error.message, success: false });
    }
}

export const getOrderBypatner = async (req, res) => {
    try {
        const { id } = req.params; 
        const foodPartner = req.foodPartner;
       
        if (!foodPartner) {
            return res.status(401).json({ message: "Log in first to get access", success: false });
        }   

       const rawOrders = await Order.find({ "items.foodPartner": id })
            .populate({
                path: 'items.foodId',
                populate: { path: 'foodPartner' }
            })
            .sort({ createdAt: -1 });
    
        if (!rawOrders || rawOrders.length === 0) {
            return res.status(200).json({ 
                message: "No orders found", 
                orders: [], 
                success: true 
            });
        }

        // 2. Filter the items within each order to show ONLY this partner's items
        const formattedOrders = rawOrders.map(order => {
            // Filter items that match the partner ID
            const partnerItems = order.items.filter(
                item => item.foodPartner.toString() === id
            );

            // Calculate subtotal for these specific items
            const partnerSubtotal = partnerItems.reduce(
                (sum, item) => sum + (item.price * item.quantity), 0
            );

            // Return a clean object for the partner dashboard
            return {
                orderId: order._id,
                customer: order.user,
                razorPay_order_id: order.razorPay_order_id,
                status: order.status,
                shippingAddress: order.shipping,
                createdAt: order.createdAt,
                partnerItems: partnerItems, // Only items belonging to THIS partner
                partnerSubtotal: partnerSubtotal // Amount the partner actually earns
            };
        });

        return res.status(200).json({ 
            message: "Partner orders fetched successfully", 
            orders: formattedOrders, 
            success: true 
        });

    } catch(error) {
        return res.status(500).json({ message: error.message, success: false });
    }
}

// work here