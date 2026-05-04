import jwt from 'jsonwebtoken';
import FoodPartner from '../model/foodPatner.model.js';
import User from '../model/user.model.js';
import 'dotenv/config';

export const foodPartnerAuth = async (req, res, next) => {
    try {
        const token = req.cookies?.token; 
        if (!token) {
            return res.status(401).json({ message: "Log in first to get access" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
       
       
        const foodPartner = await FoodPartner.findOne({ _id: decoded.id });
       
        if (!foodPartner) {
            return res.status(404).json({ message: "Partner not found" });
        }

        req.foodPartner = foodPartner;
        next();

    } catch (error) {
       
        return res.status(401).json({ message: "Invalid token" });
    }
};

export const userAuth = async (req, res, next) => {
    try {
        const token = req.cookies?.token; 
        if (!token) {
            return res.status(401).json({ message: "Log in first to get access" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        req.user = user; 
        next();
    } catch (error) {
        return res.status(401).json({ message: error.message });
    }
}