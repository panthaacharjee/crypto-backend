const mongoose = require("mongoose");

const withdrawSchema = new mongoose.Schema({
  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"user"
  } , 
  amount:{
    type:Number,
    default:0,
  },
  address:{
    type:String,
  },
  status:{
    type:String,
    default:"Pending"
  },
  createdAt:{
    type:Date,
    default:Date.now
  }
 
});


module.exports = mongoose.model("withdraw", withdrawSchema);