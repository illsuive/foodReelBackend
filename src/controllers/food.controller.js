import Food from "../model/food.model.js";
import { uploadFiles , deleteFile  } from "../utils/imageKit.js";
import mongoose from "mongoose";
import FoodPartner from "../model/foodPatner.model.js";

export const createFood = async (req, res) => {
    let uploadedVideo = null; 
    try {
        const foodPartner = req.foodPartner;
        
        if (!foodPartner) {
            return res.status(401).json({ message: "Log in first to get access", success: false });
        }

        const { name, description, price, category } = req.body;

        if (!name || !description || !price || !category) {
            return res.status(400).json({ message: "All text fields are required.", success: false });
        }

        const videoFile = req.file || (req.files && req.files.video ? req.files.video[0] : null);

        if (!videoFile) {
            return res.status(400).json({ message: "Food video is required.", success: false });
        }

        uploadedVideo = await uploadFiles(videoFile);
        
        // Create Food Record
        const newFood = await Food.create({
            name,
            description,
            price: Number(price),
            category,
            video: uploadedVideo.url,
            videoFileId: uploadedVideo.fileId,
            foodPartner: foodPartner._id,
        });

        foodPartner.totalMeals.push(newFood._id);
        await foodPartner.save();

        const populatedFood = await Food.findById(newFood._id).populate('foodPartner', '-password');

        return res.status(201).json({
            success: true,
            message: "Food item created successfully",
            food: populatedFood
        });

    } catch (error) {
        if (uploadedVideo) await deleteFile(uploadedVideo.fileId);

        console.error("Create Food Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });
    }
};

export const fetchAllFoods = async (req, res) => {
    try {
        const { _id } = req.user;
        
        // // _id , fullName , email
        const foods = await Food.find()
        .populate('foodPartner')
        .select('-password')
        .sort({ createdAt: -1 }) ;

        if (!foods) {
            return res.status(404).json({ message: "No foods found", success: false });
        }
        return res.status(200).json({ message: "Fetched all foods successfully", foods , success: true });

    } catch (error) {
        return res.status(500).json({ message: error.message, success: false });
    }
}

export const deleteFood = async (req, res) => {
    try {
        const { id } = req.params;
        const foodPartner = req.foodPartner;

        if (!foodPartner) {
            return res.status(401).json({ message: "Log in first to get access", success: false });
        }

        const food = await Food.findById(id);

        if (!food) {
            return res.status(404).json({ message: "Food not found", success: false });
        }

        if (food.foodPartner.toString() !== foodPartner._id.toString()) {
            return res.status(403).json({ message: "You are not the owner of this food item", success: false });
        }
        
        if (food.videoFileId) {
            await deleteFile(food.videoFileId);
        }

        await foodPartner.totalMeals.pull(id);

        await foodPartner.save();

        await Food.findByIdAndDelete(id);

        const allFood = await Food.find().populate('foodPartner').select('-password');

        return res.status(200).json({ message: "Food deleted successfully", foods: allFood, success: true });
    } catch (error) {
        return res.status(500).json({ message: error.message, success: false });
    }
}

export const UpdateFood = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, category } = req.body;
        const foodPartner = req.foodPartner;

        if (!foodPartner) {
            return res.status(401).json({ message: "Log in first", success: false });
        }

        const food = await Food.findById(id);
        if (!food) {
            return res.status(404).json({ message: "Food not found", success: false });
        }

        // Ownership Check
        if (food.foodPartner.toString() !== foodPartner._id.toString()) {
            return res.status(403).json({ message: "Unauthorized", success: false });
        }

        let videoUpdateData = {};

        // Extract file from either req.file (single) or req.files (fields)
        const videoFile = req.file || (req.files && req.files.video ? req.files.video[0] : null);

        if (videoFile) {
            // 1. Delete old video from ImageKit
            if (food.videoFileId) {
                try {
                    await deleteFile(food.videoFileId);
                } catch (err) {
                    console.log("Old file not found on ImageKit, proceeding with upload...");
                }
            }

            // 2. Upload new video and capture the new URL/ID
            const uploadedVideo = await uploadFiles(videoFile);
            
            videoUpdateData = {
                video: uploadedVideo.url,
                videoFileId: uploadedVideo.fileId
            };
        }

        // 3. Update Database
        const updatedFood = await Food.findByIdAndUpdate(
            id,
            { 
                name, 
                description, 
                price: Number(price), 
                category,
                ...videoUpdateData 
            },
            { new: true }
        ).populate('foodPartner', '-password');

        return res.status(200).json({ 
            message: "Food updated successfully", 
            food: updatedFood, 
            success: true 
        });

    } catch (error) {
        console.error("Update Food Error:", error);
        return res.status(500).json({ message: error.message, success: false });
    }
};

// Handle like/unlike food items

export const HandleLikeFood = async (req, res) => {
    try {
        const { foodId } = req.body;
         const { _id } = req.user; 

        if (!foodId) {
            return res.status(400).json({ message: "Food ID is required", success: false });
        }

        // Find the food document
        const food = await Food.findById(foodId);
        if (!food) {
            return res.status(404).json({ message: "Food reel not found", success: false });
        }

        const isLiked = food.likes.includes(_id);

        if (isLiked) {
            // Unlike: Remove the userId from the array
            food.likes = food.likes.filter((id) => id.toString() !== _id.toString());
        } else {
            // Like: Add the userId to the array
            food.likes.push(_id);
        }

        await food.save();

        return res.status(200).json({ 
            message: isLiked ? "Unliked successfully" : "Liked successfully", 
            success: true, 
            likesCount: food.likes.length,
            isLiked: !isLiked ,// Return the new status for frontend UI update
        });

    } catch (error) {
        return res.status(500).json({ message: error.message, success: false });
    }
};
