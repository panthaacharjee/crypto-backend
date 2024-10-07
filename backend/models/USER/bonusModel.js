const mongoose = require("mongoose");

const bonusSchema = new mongoose.Schema({
  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"user"
  },
  title:{
    type:String,
  },
  description:{
    type:String,
  },
  amount:{
    type:Number,
    default:0,
  },
  createdAt:{
    type:Date,
    default:Date.now
  }
 
});


module.exports = mongoose.model("bonus", bonusSchema);