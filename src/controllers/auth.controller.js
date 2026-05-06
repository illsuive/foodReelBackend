import mongoose from "mongoose";
import bcrypt from 'bcryptjs'
import User from "../model/user.model.js";
import FoodPartner from '../model/foodPatner.model.js'
import jwt from "jsonwebtoken";
import 'dotenv/config';
import Food from "../model/food.model.js";

export const createUser = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "All fields are required", success: false });
        }
        
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" , success : false});
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({ fullName, email, password: hashedPassword });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });

        res.cookie("token", token, {  httpOnly : true , secure : true });
        
        await user.save();

        return res.status(201).json({ message: "User created successfully", success : true , user : {
            id : user._id,
            fullName : user.fullName,
            email : user.email,
            token : token
        } });
    } catch (error) {
        return res.status(500).json({ message: error.message, success: false });
    }
}

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required", success: false });
        }
        const user = await User.findOne({ email })
        .populate('orders')
        .populate('bookmarks')
        .select("+password") 

        if (!user) {
            return res.status(400).json({ message: "User does not exist", success: false });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials", success: false });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });

        res.cookie('token', token, {  httpOnly : true , secure : true });

        return res.status(200).json({ message: "Login successful", success : true , user });
    } catch (error) {
        return res.status(500).json({ message: error.message, success: false });
    }
}

export const logoutUser = async (req, res) => {
    try {
        res.clearCookie("token");
        return res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        return res.status(500).json({ message: error.message , success : false});
    }
}

export const fetchUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        
        if (!user) {
            return res.status(404).json({ message: "User not found", success: false });
        }
        return res.status(200).json({ message: "User found", success: true, user });
    } catch (error) {
        return res.status(500).json({ message: error.message , success : false});
    }

}

// user ^

export const registerFoodPatner = async (req, res) => {
    try {
        const { fullName, email, password , phoneNo , address , restaurant} = req.body;
        if (!fullName || !email || !password || !phoneNo || !address || !restaurant) {
            return res.status(400).json({ message: "All fields are required", success: false });
        }

        const foodPartner = await FoodPartner.findOne({ email });

        if (foodPartner) {
            return res.status(400).json({ message: "Food Partner already exists", success: false });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await FoodPartner.create({ fullName, email, password: hashedPassword , phoneNo , address , restaurant});

        const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });

        res.cookie("token", token, {  httpOnly : true , secure : true });

        await newUser.save();

        return res.status(201).json({ message: "Food Partner registered successfully", success: true, user: {
            id: newUser._id,
            fullName: newUser.fullName,
            email: newUser.email,
            phoneNo: newUser.phoneNo,
            address: newUser.address,
            restaurant: newUser.restaurant,
            token: token
        } });

    } catch (error) {
        return res.status(500).json({ message: error.message , success : false});
    }
}

export const loginFoodPartner = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required", success: false });
        }

        let foodPartner = await FoodPartner.findOne({ email })
            .select("+password") 
            .populate('totalMeals');

        if (!foodPartner) {
            return res.status(400).json({ message: "Food Partner does not exist", success: false });
        }

        const isMatch = await bcrypt.compare(password, foodPartner.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials", success: false });
        }

        const token = jwt.sign({ id: foodPartner._id }, process.env.JWT_SECRET, {
            expiresIn: "1d",
        });

        const partnerData = foodPartner.toObject();
        delete partnerData.password;

        res.cookie("token", token, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === "production", 
            sameSite: "strict",
            maxAge: 24 * 60 * 60 * 1000 
        });

        return res.status(200).json({ 
            message: "Login successful", 
            success: true, 
            user: partnerData 
        });
    } catch (error) {
        return res.status(500).json({ message: error.message, success: false });
    }
}

export const logoutFoodPartner = async (req, res) => {
    try {
        res.clearCookie("token");
        return res.status(200).json({ message: "Logout successful", success: true });
    } catch (error) {
        return res.status(500).json({ message: error.message , success : false});
    }
}

export const fetchPatnerByid = async (req, res) => {
    try {
        const { id } = req.params;
        const foodPartner = await FoodPartner.findById(id).populate('totalMeals').select('-password');
        if (!foodPartner) {
            return res.status(404).json({ message: "Food Partner not found", success: false });
        }
        return res.status(200).json({ message: "Food Partner fetched successfully", foodPartner, success: true });
    } catch (error) {
        return res.status(500).json({ message: error.message , success : false});
    }
}
// food partner ^