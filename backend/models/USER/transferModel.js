const mongoose = require("mongoose");

const transferSchema = new mongoose.Schema({
  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"user"
  },
  amount:{
    type:Number,
  },
  sendWallet:{
    type:String,
  },
  reciveWallet:{
    type:String,
  },
  createdAt:{
    type:Date,
    default:Date.now
  }
 
});



module.exports = mongoose.model("transfer", transferSchema);