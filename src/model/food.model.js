import mongoose from "mongoose";
import FoodPartner from "../model/foodPatner.model.js";

const foodSchema = new mongoose.Schema({
    name : {type : String, required : true},
    description : {type : String, required : true},
    video : {type : String, required : true},
    videoFileId: { type: String, required: true }, 
    price : {type : Number, required : true},
    category : {type : String, required : true} ,
    foodPartner : {type : mongoose.Schema.Types.ObjectId, ref : "FoodPartner"},
    likes : [{type : mongoose.Schema.Types.ObjectId, ref : "User"}],
    isSaved : {type : Boolean , default : false}

})

const Food = mongoose.model("Food", foodSchema)

export default Food;