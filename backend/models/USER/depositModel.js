const mongoose = require("mongoose");

const depositSchema = new mongoose.Schema({
  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"user"
  } , 
  amount:{
    type:Number,
    default:0,
  },
  trxID:{
    type:String,
  },
  trxProof:{
    type:String,
  },
  status:{
    type:String,
    default:"Pending"
  },
  createdAt:{
    type:Date,
    default:Date.now()
  }
 
});


module.exports = mongoose.model("deposit", depositSchema);