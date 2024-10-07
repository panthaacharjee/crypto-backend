const mongoose = require("mongoose");

const botSchema = new mongoose.Schema({
  startHour:{
    type: Number,
  },
  startMinute:{
    type: Number,
  },
  first:{
    type:Number,
  },
  second:{
    type:Number,
  },
  third:{
    type:Number,
  },
  four:{
    type:Number
  },
  five:{
    type:Number
  },
  coin:{ 
    type:Number,
  },
  trade:{
    type:Number
  },
  status:{
    type: String,
    default: "Deactivate"
  }

});


module.exports = mongoose.model("bot", botSchema);