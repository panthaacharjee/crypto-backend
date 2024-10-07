const mongoose = require("mongoose");

const exchangeSchema = new mongoose.Schema({
  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"user"
  },
  coin:{
    type:String,
  },
  currency:{
    type:String,
  },
  tax:{
    type:Number,
    default:0,
  },
  createdAt:{
    type:Date,
    default:Date.now()
  }
 
});


module.exports = mongoose.model("exchange", exchangeSchema);