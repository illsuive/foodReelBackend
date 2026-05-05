import FoodCart from "../model/foodCart.model.js";
import User from "../model/user.model.js";

const calculateTotal = (items) => {
    return items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
};

const formatCartResponse = async (user_id) => {
    const cart = await FoodCart.findOne({ user: user_id })
        .populate({
            path: 'items.foodId',
            populate: { path: 'foodPartner' }
        });

    if (!cart) {
        return res.status(404).json({ message: "Cart not found", success: false });
    };

    const groupedByPartner = cart.items.reduce((acc, item) => {
        const partnerId = item.foodPartner.toString();
        const partnerDetails = item.foodId?.foodPartner;

        if (!acc[partnerId]) {
            acc[partnerId] = {
                foodPartnerId: partnerId,
                restaurantName: partnerDetails?.restaurant || "Restaurant",
                video : partnerDetails?.video || null,
                partnerSubtotal: 0,
                items: []
            };
        }

        acc[partnerId].items.push(item);
        acc[partnerId].partnerSubtotal += item.price * item.quantity;
        return acc;
    }, {});

    return {
        userId: user_id,
        totalAmount: cart.totalPrice,
        groupedItems: Object.values(groupedByPartner)
    };
};

export const AddToCart = async (req, res) => {
    try {
        const { _id } = req.user;

        const { foodId, name, price, foodPartner } = req.body;

        if (!foodId || !name || !price || !foodPartner) {
            return res.status(400).json({ message: "Missing required fields", success: false });
        }

        let cart = await FoodCart.findOne({ user: _id });

        if (cart) {
            const itemIndex = cart.items.findIndex(item => item.foodId.toString() === foodId);
            if (itemIndex > -1) {
                cart.items[itemIndex].quantity += 1;
            } else {
                cart.items.push({ foodId, foodPartner, name, price, quantity: 1 });
            }
        } else {
            cart = new FoodCart({
                user: _id,
                items: [{ foodId, foodPartner, name, price, quantity: 1 }]
            });
        }

        cart.totalPrice = calculateTotal(cart.items);
        await cart.save();

        const responseData = await formatCartResponse(_id);
        return res.status(200).json({ message: "Item added to cart", success: true, cart: responseData });
    } catch (error) {
        return res.status(500).json({ message: error.message, success: false });
    }
};

export const ReduceQuantity = async (req, res) => {
    try {
        const { _id } = req.user;
        const { foodId } = req.body;

        let cart = await FoodCart.findOne({ user: _id });
        if (!cart) return res.status(404).json({ message: "Cart not found", success: false });

        const itemIndex = cart.items.findIndex(item => item.foodId.toString() === foodId);

        if (itemIndex > -1) {
            if (cart.items[itemIndex].quantity > 1) {
                cart.items[itemIndex].quantity -= 1;
            } else {
                cart.items.splice(itemIndex, 1);
            }

            cart.totalPrice = calculateTotal(cart.items);
            await cart.save();

            const responseData = await formatCartResponse(_id);
            return res.status(200).json({ message: "Quantity updated", success: true, cart: responseData });
        }
        return res.status(404).json({ message: "Item not in cart", success: false });
    } catch (error) {
        return res.status(500).json({ message: error.message, success: false });
    }
};

export const IncreaseQuantity = async (req, res) => {
    try {
        const { _id } = req.user;
        const { foodId } = req.body;

        let cart = await FoodCart.findOne({ user: _id });
        if (!cart) return res.status(404).json({ message: "Cart not found", success: false });

        const itemIndex = cart.items.findIndex(item => item.foodId.toString() === foodId);
        if (itemIndex === -1) return res.status(404).json({ message: "Item not found", success: false });

        cart.items[itemIndex].quantity += 1;
        cart.totalPrice = calculateTotal(cart.items);

        await cart.save();
        const responseData = await formatCartResponse(_id);
        return res.status(200).json({ success: true, cart: responseData });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const RemoveFromCart = async (req, res) => {
    try {
        const { _id } = req.user;
        const { foodId } = req.body;

        let cart = await FoodCart.findOne({ user: _id });
        if (!cart) return res.status(404).json({ message: "Cart not found", success: false });

        cart.items = cart.items.filter(item => item.foodId.toString() !== foodId);
        cart.totalPrice = calculateTotal(cart.items);

        await cart.save();
        const responseData = await formatCartResponse(_id);
        return res.status(200).json({ message: "Item removed from cart", success: true, cart: responseData });
    } catch (error) {
        return res.status(500).json({ message: error.message, success: false });
    }
};

export const ClearCart = async (req, res) => {
    try {
        const { _id } = req.user;
        let cart = await FoodCart.findOne({ user: _id });
        if (!cart) return res.status(404).json({ message: "Cart not found", success: false });

        cart.items = [];
        cart.totalPrice = 0;
        await cart.save();

        return res.status(200).json({
            message: "Cart cleared",
            success: true,
            cart: { userId: _id, totalAmount: 0, groupedItems: [] }
        });
    } catch (error) {
        return res.status(500).json({ message: error.message, success: false });
    }
}

export const GetCart = async (req, res) => {
    try {
        const { _id } = req.user;
        const responseData = await formatCartResponse(_id);

        if (!responseData) {
            return res.status(404).json({ message: "Cart not found", success: false });
        }

        return res.status(200).json({
            message: "Cart retrieved",
            success: true,
            cart: responseData
        });
    } catch (error) {
        return res.status(500).json({ message: error.message, success: false });
    }
};
