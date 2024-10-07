const mongoose = require("mongoose");
const validator = require("validator");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your name"],
  },
  userName: {
    type: String,
    unique:true
  },
  email: {
    type: String,
    required: [true, "Please enter your email"],
    unique: true,
    validate: [validator.isEmail, "Please enter a valid email"],
  },
  password: {
    type: String,
    required: [true, "Please enter your password"],
    select: false,
  },

  avatar:{
    public_id : {
      type:String
    },
    url : {
      type: String
    },
  },

  gender:{
    type:String,
  },
  city:{
    type: String,
  },
  phone:{
    type:String,
  },
  address:{
    type:String,
  },

  role: {
    type: String,
    default: "user",
  },
  reffer:{
    type:String,
  },
  kyc:{
      type:mongoose.Schema.Types.ObjectId,
      ref: "kyc"
  },
  kycStatus:{
    type:String,
    default: "Pending"
  },

  //WALLET TRANSECTION
  deposit:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:"deposit"
    }
  ],
  withdraw:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:"withdraw"
    }
  ],

  //WALLET COIN
  fundingBalance:{
    type:Number,
    default:0
  },
  spotBalance:{
    type:Number,
    default:0
  },
  aiBalance:{
    type:Number,
    default:0
  },
  coinBalance:{
    type:Number,
    default:0
  },

  //WALLET HISTORY
  fundingHistory:[
    {
      history:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"transfer"
      },
      status:{
        type:String,
      }
    }
  ],
  spotHistory:[
    {
      history:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"transfer"
      },
      status:{
        type:String,
      }
    }
  ],
  aiHistory:[
    {
      history:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"transfer"
      },
      status:{
        type:String,
      }
    }
  ],
  otsHistory:{
    sent:[
      {
        type:mongoose.Schema.Types.ObjectId,
        ref:"ots"
      }
    ],
    recive:[
      {
        type:mongoose.Schema.Types.ObjectId,
        ref:"ots"
      }
    ]
  },

  //BOT OPTION
  tradeStatus:{
    type:Boolean,
    default:false
  },

  tradeIncome:{
    type:Number,
    default:0
  },

  coinIncome:{
    type:Number,
    default:0
  },

  firstLevelIncome:{
    type:Number,
    default:0
  },

  secondLevelIncome:{
    type:Number,
    default:0
  },
  thirdLevelIncome:{
    type:Number,
    default:0
  },
  fourLevelIncome:{
    type:Number,
    default:0
  },
  fiveLevelIncome:{
    type:Number,
    default:0
  },

  //REFFERAL TEAMS
  team:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:"user"
    }
  ],

  teamBonus:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:"bonus"
    }
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },

  resetPasswordToken: String,
  resetPasswordExpire: String,

  updatePasswordToken:String,
  updatePasswordExpire:String,

  updatePhoneToken:String,
  updatePhoneExpire:String,
});

//Hashing Password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcryptjs.hash(this.password, 10);
});

//JWT Token
userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

//Compare Password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

//Generating Password Reset Token
userSchema.methods.getResetPasswordToken = function () {
  //Generating Token
  const resetToken = crypto.randomBytes(20).toString("hex");

  //Hashing and adding resetPasswordToken to userSchema
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  return resetToken;
};

//Generating Password Update Token
userSchema.methods.getUpdatePasswordToken = function () {
  //Generating Token
  const updateToken = crypto.randomBytes(20).toString("hex");

  //Hashing and adding resetPasswordToken to userSchema
  this.updatePasswordToken = crypto
    .createHash("sha256")
    .update(updateToken)
    .digest("hex");

  this.updatePasswordExpire = Date.now() + 15 * 60 * 1000;
  return updateToken;
};


module.exports = mongoose.model("user", userSchema);