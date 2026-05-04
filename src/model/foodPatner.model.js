import mongoose from "mongoose";

const foodPatnerSchema = new mongoose.Schema({
    fullName : {type : String , required : true},
    restaurant : {type : String , required : true},
    email : {type : String , required : true , unique : true},  
    password : {type : String , required : true , select: false},
    phoneNo : {type : String , required : true},
    address : {type : String , required : true},
    customers : [{type : mongoose.Schema.Types.ObjectId, ref : "User"}],
    totalMeals : [{type : mongoose.Schema.Types.ObjectId, ref : "Food"}]
} , {timestamps : true})

const FoodPartner = mongoose.model('FoodPartner' , foodPatnerSchema)

export default FoodPartner;
