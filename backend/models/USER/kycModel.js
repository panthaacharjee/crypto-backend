const mongoose = require("mongoose");

const kycSchema = new mongoose.Schema({
  font:{
    type:String,
  },
  back:{
    type:String,
  },
  selfie:{
    type:String,
  },
  type:{
    type:String,
  },
  dob:{
    type:Date,
  },
  document:{
    type:String,
  },
  status:{
    type:String,
    default:"Pending"
  },
  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"user"
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});


module.exports = mongoose.model("kyc", kycSchema);