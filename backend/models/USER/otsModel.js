const mongoose = require("mongoose");

const otsSchema = new mongoose.Schema({
  sender:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"user"
  },
  reciver:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"user"
  }, 
  amount:{
    type:Number,
    default:0,
  },
  charge:{
    type:Number,
  },
  createdAt:{
    type:Date,
    default:Date.now()
  }
 
});


module.exports = mongoose.model("ots", otsSchema);