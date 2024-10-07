const crypto = require("crypto")
const cloudinary = require("cloudinary");
const { isNumeric } = require("validator");



/* ================= UTILS AND MIDDLEWARE ==================== */
const catchAsyncError = require("../middleware/catchAsyncError");
const ErrorHandler = require("../utils/errorhandler");
const sendToken = require("../utils/jwtToken");
const sendMail = require("../utils/sendMail");
const ApiFetaures = require("../utils/apifetures");




/* ============ MODELS IMPORT ============== */
const User  = require("../models/USER/userModel")
const Admin = require("../models/ADMIN/adminModel")
const KYC = require("../models/USER/kycModel")
const Deposit = require("../models/USER/depositModel")
const Withdraw = require("../models/USER/withdrawModel")
const Transfer = require("../models/USER/transferModel")
const OTS = require("../models/USER/otsModel");
const Bonus = require("../models/USER/bonusModel")
const Exchange= require("../models/USER/exchangeModel")




/* ===================================================================================================== */
/* ============================= REGISTER USER (POST) (/register/user) ================================= */
/* ===================================================================================================== */

exports.registerUser = catchAsyncError(async (req, res, next) => {
    const { userName, name, email, password, refferId } = req.body;
    const emailUser = await User.findOne({ email });
    const nameUser = await User.findOne({userName});
    if (emailUser) {
      return next(new ErrorHandler("THIS USER EMAIL ALREADY EXIST", 400));
    }

    if (nameUser) {
      return next(new ErrorHandler("THIS USER NAME ALREADY EXIST", 400));
    }
  
    // const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
    //   folder: "avatars",
    //   width: 300,
    //   height: 300,
    //   crop: "scale",
    // });
    function Str_Random(length) {
      let result = '';
      const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
      
      // Loop to generate characters for the specified length
      for (let i = 0; i < length; i++) {
          const randomInd = Math.floor(Math.random() * characters.length);
          result += characters.charAt(randomInd);
      }
      return result;
    }
    const reffer = Str_Random(7)
    const user = await User.create({
      name,
      userName, 
      email,
      password, 
      reffer,
    });
  
    if(refferId){
      const refferUser = await User.findOne({reffer: refferId})
      if(refferUser){
        await refferUser.team.push(user._id)
          await refferUser.save();
      }
    }
    sendToken(user, 201, res, "USER");
  });


/* ===================================================================================================== */
/* ================================ LOGIN USER (POST) (/login/user) ==================================== */
/* ===================================================================================================== */

exports.loginUser = catchAsyncError(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email | !password) {
      return next(new ErrorHandler("PLEASE ENTER EMAIL & PASSWORD", 400));
    }
    
    let user;

    if(req.body.role==="USER"){
       user = await User.findOne({ email }).select("+password")
    }else if (req.body.role === "ADMIN"){
       user = await Admin.findOne({email}).select("+password")
    }else{
      return next(new ErrorHandler("PLEASE CONTACT WITH ADMINISTRATION", 401));
    }
  
    if (!user) {
      return next(new ErrorHandler("PLEASE ENTER VALID EMAIL OR PASSWORD", 401));
    }
    const isPasswordMatched = await user.comparePassword(password);
  
    if (!isPasswordMatched) {
      return next(new ErrorHandler("PLEASE ENTER VALID EMAIL OR PASSWORD", 401));
    }
    sendToken(user, 200, res, req.body.role)
  });

/* ===================================================================================================== */
/* ============================= LOGOUT USER (GET) (/logout) ================================= */
/* ===================================================================================================== */

exports.logout = catchAsyncError(async (req, res, next) => {
    res.cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    });
    res.status(200).json({
      success: true,
      message: "LOG OUT",
    });
  });


/* ===================================================================================================== */
/* ========================== FORGOT PASSWORD (POST) (/password/forgot) ================================ */
/* ===================================================================================================== */
exports.forgotPassword = catchAsyncError(async (req, res, next) => {
    const {email, userName} = req.body
    let user;
  
    if(email !== ""){
      user = await User.findOne({ email: req.body.email })
    }else if(userName !== ""){
      user = await User.findOne({userName: req.body.userName})
    }else{
      return next(new ErrorHandler("USER NOT FOUND", 404));
    }

    if(!user){
      return next(new ErrorHandler("USER NOT FOUND", 404));
    }

    //Get Reset Password Token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });
    const resetPasswordUrl = `http://localhost:${process.env.FONTEND_URL}/password/reset/${resetToken}`;
    const message = `Your password reset token is :-\n\n ${resetPasswordUrl}\n\nIf you have not requested this email then, please ignore it`;
  
    try {
      await sendMail({
        email: user.email,
        subject: `Orion Trading -- Password Recovary`,
        message,
      });
      res.status(200).json({
        success: true,
        message: `EMAIL SENT TO ${user.email} SUCCESSFULLY`,
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
  
      await user.save({ validateBeforeSave: false });
      return next(new ErrorHandler(error.message, 500));
    }
});



/* ===================================================================================================== */
/* ========================== RESET PASSWORD (PUT) (/password/reset/:token) ============================ */
/* ===================================================================================================== */
exports.resetPassword = catchAsyncError(async (req, res, next) => {
    //Creating Token Hash
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");
  
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });
  
    if (!user) {
      return next(
        new ErrorHandler(
          "RESET PASSWORD TOKEN IS INVALID OR HAS BEEN EXPIRED",
          400
        )
      );
    }

    if(req.body.password === ""){
      return next(
        new ErrorHandler(
          "PASSWORD IS REQUIRED",
          400
        )
      );
    }
  
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
  
    await user.save();
    sendToken(user, 200, res, "USER");
  });


/* ===================================================================================================== */
/* ========================== USER PROFILE (GET) (/profile/me) ============================ */
/* ===================================================================================================== */
exports.getUserDetails = catchAsyncError(async (req, res, next) => {
    const  user = await User.findById(req.user.id).populate("kyc")
    res.status(200).json({
      success: true,
      user,
    });
  });


/* ===================================================================================================== */
/* ========================== USER VERIFICATION (PUT) (/user/verification) ============================ */
/* ===================================================================================================== */
exports.userVerification = catchAsyncError(async (req, res, next) => {
  const {font, back, selfie, document, type, dob} = req.body;
  const  user = await User.findById(req.user.id)

  const fontImage = await cloudinary.v2.uploader.upload(font, {
    folder: "kyc",
  });
  const backImage = await cloudinary.v2.uploader.upload(back, {
    folder: "kyc",
  });
  const selfieImage = await cloudinary.v2.uploader.upload(selfie, {
    folder: "kyc",
  });
   
  const kyc = await KYC.create({
    font:fontImage.secure_url,
    back:backImage.secure_url, 
    selfie:selfieImage.secure_url,
    type, 
    document,
    dob,
    user: user._id
  });
  await User.findByIdAndUpdate(user._id, {
    kyc: kyc._id,
    kycStatus:"Submited"

  }, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
  })
  
  res.status(200).json({
    success: true,
    message: "SUCCESSFULLY REQUEST SENT"
  });
});


/* ===================================================================================================== */
/* ================== TOKEN SENT FOR UPDATE PASSWORD (GET) (/sent/password/token) ======================== */
/* ===================================================================================================== */
exports.sentUpdatePasswordToken = catchAsyncError(async(req,res, next)=>{
  const user = await User.findById(req.user._id)
  //Get Reset Password Token
  const updateToken = user.getUpdatePasswordToken();
  await user.save({ validateBeforeSave: false });
  const message = `Your password Update token is :-\n\n ${updateToken}\n\nIf you have not requested this email then, please ignore it`;

  try {
    await sendMail({
      email: user.email,
      subject: `Orion Trading -- Password Update Token`,
      message,
    });
    res.status(200).json({
      success: true,
      message: `EMAIL SENT TO ${user.email} SUCCESSFULLY`,
    });
  } catch (error) {
    user.updatePasswordToken = undefined;
    user.updatePasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler(error.message, 500));
  }
})



/* ===================================================================================================== */
/* =========================== UPDATE PASSWORD (PUT) (/update/password) ================================ */
/* ===================================================================================================== */
exports.updatePassword = catchAsyncError(async (req, res, next) => {
  
  if (!req.body.token) {
    return next(new ErrorHandler("Please Enter Token", 401));
  }

 //Creating Token Hash
 const updatePasswordToken = crypto
 .createHash("sha256")
 .update(req.body.token)
 .digest("hex");

 if (req.body.newPassword !== req.body.confirmPassword) {
  return next(new ErrorHandler("Password does not matched", 401));
}

const user = await User.findOne({
 updatePasswordToken,
 updatePasswordExpire: { $gt: Date.now() },
}).select("+password")

  const isPassowrdMatched = await user.comparePassword(req.body.oldPassword);

  if (!isPassowrdMatched) {
    return next(new ErrorHandler("OLD PASSWORD IS INCORRECT", 400));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendToken(user, 200, res, "USER" );
});


/* ===================================================================================================== */
/* =========================== UPDATE PROFILE (PUT) (/profile/update) ================================ */
/* ===================================================================================================== */
exports.updateProfile = catchAsyncError(async (req, res, next) => {
  const {name,  gender, city, phone, address} = req.body
  const newUserData = {
    name: name,
    gender:gender,
    city:city, 
    phone:phone, 
    address:address
    // address: req.body.address,
  };

  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({
    success: true,
    user,
  });
});

/* ===================================================================================================== */
/* =========================== UPDATE AVATAR (PUT) (/avatar/update) ================================ */
/* ===================================================================================================== */
exports.updateAvatar = catchAsyncError(async (req, res, next) => {
  const {avatar} = req.body
  if (avatar !== "") {
    const user = await User.findById(req.user.id);

    const imageId = user.avatar.public_id;

    if (imageId) {
      await cloudinary.v2.uploader.destroy(imageId);
    }

    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
      folder: "avatars",
      width: 200,
      crop: "scale",
    });

    
    await User.findByIdAndUpdate(req.user.id, {avatar : {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    }}, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });
    res.status(200).json({
      success: true,
      message:"SUCCESSFULLY CHANGED",
    });
  }

  
});

/* ===================================================================================================== */
/* =========================== USER DEPOSIT REQUEST (POST) (/user/deposit) ================================ */
/* ===================================================================================================== */
exports.depositUser = catchAsyncError(async (req, res, next) => {
  const { amount, trxId, proof } = req.body;
  const  user = await User.findById(req.user.id)

  if(!amount){
    return next(new ErrorHandler("PLEASE ENTER VALID AMOUNT", 401))
  }
  if(amount<=0){
    return next(new ErrorHandler("PLEASE ENTER A INTIGER AMOUNT", 401))
  }
  if(!isNumeric(amount)){
    return next(new ErrorHandler("PLEASE ENTER VALID AMOUNT", 401))
  }
  const trxProofImage = await cloudinary.v2.uploader.upload(proof, {
    folder: "deposit",
  });
   
  const deposit = await Deposit.create({
    trxProof:trxProofImage.secure_url,
    trxId, 
    amount,
    user: user._id
  });
  await user.deposit.push(deposit._id)
  await user.save()
  
  const allDeposit = await Deposit.find()
  res.status(200).json({
    success: true,
    message: "SUCCESSFULLY DEPOSIT CREATED",
    deposits: allDeposit
  });
});

/* ===================================================================================================== */
/* =========================== GET DEPOSIT REQUEST (GET) (/user/all/deposit) ================================ */
/* ===================================================================================================== */

exports.allDepositUser = catchAsyncError(async (req, res, next) => {
  const allDeposit = await Deposit.find({user:req.user._id})
  
  res.status(200).json({
    success: true,
    allDeposit
  });
});


/* ===================================================================================================== */
/* ======================== USER WITHDRAW REQUEST (POST) (/user/withdraw) ============================== */
/* ===================================================================================================== */
exports.withdrawUser = catchAsyncError(async (req, res, next) => {
  const { amount, address, password } = req.body;
  const  user = await User.findById(req.user.id).select("+password")

  if(!amount){
    return next(new ErrorHandler("PLEASE ENTER A VALID AMOUNT", 401))
  }

  if(user.fundingBalance<amount){
    return next(new ErrorHandler("INVALID FUND", 401))
  }

  if(user.fundingBalance<10){
    return next(new ErrorHandler("INVALID FUND", 401))
  }
  if(amount<10){
    return next(new ErrorHandler("INITIAL WITHDRAW IS 10 USDT", 401))
  }

  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("INVALID PASSWORD", 401));
  }
  // console.log(password)
  
  const withdraw = await Withdraw.create({
    address, 
    amount,
    user: user._id
  });

  const fundingBalance = user.fundingBalance - amount

  await User.findByIdAndUpdate(user._id, { fundingBalance: fundingBalance}, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  await user.withdraw.push(withdraw._id)
  await user.save()
  
  
  res.status(200).json({
    success: true,
    message: "SUCCESSFULLY WITHDRAW CREATED"
  });
});


/* ===================================================================================================== */
/* =========================== FUNDING TO SPOT (POST) (/funding/to/spot) ================================ */
/* ===================================================================================================== */
exports.fundingToSpot= catchAsyncError(async (req, res, next)=>{
  const {amount} = req.body
  const user = await User.findById(req.user._id)

  if(!amount){
    return next(new ErrorHandler("PLEASE ENTER A VALID AMOUNT", 401))
  }
  if(amount<=0){
    return next(new ErrorHandler("PLEASE ENTER A INTIGER AMOUNT", 401))
  }
  if(user.fundingBalance < amount){
    return next(new ErrorHandler("INVALID FUND", 502))
  }

  const fundingBalance = user.fundingBalance - amount;
  const spotBalance = user.spotBalance + amount;

  const transfer = await Transfer.create({
    amount,
    user: user._id,
    sendWallet:"Funding",
    reciveWallet:"Spot"
  })

  await User.findByIdAndUpdate(user._id, { fundingBalance: fundingBalance}, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  await User.findByIdAndUpdate(user._id, { spotBalance: spotBalance}, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });


  await user.fundingHistory.push({
    history:transfer._id,
    status:"Out"
  })
  await user.spotHistory.push({
    history:transfer._id,
    status:"In"
  })
  await user.save();

  res.status(200).json({
    success: true,
    message: "SUCCESSFULLY AMOUNT TRANSFERED"
  });
})


/* ===================================================================================================== */
/* =========================== SPOT TRANSFER (PUT) (/spot/transfer) ================================ */
/* ===================================================================================================== */
exports.spotTransfer= catchAsyncError(async (req, res, next)=>{
  const {amount, wallet} = req.body
  const user = await User.findById(req.user.id)
  
  if(!wallet){
    return next(new ErrorHandler("PLEASE SELECT A WALLET ADDRESS", 401))
  }
  if(!amount){
    return next(new ErrorHandler("PLEASE ENTER A VALID AMOUNT", 401))
  }
  if(amount<=0){
    return next(new ErrorHandler("PLEASE ENTER A INTIGER AMOUNT", 401))
  }
  if(user.spotBalance < amount){
    return next(new ErrorHandler("INVALID FUND", 502))
  }

  if(wallet ==="AI"){
    const aiBalance = user.aiBalance + amount;
    const spotBalance = user.spotBalance - amount;

    const transfer = await Transfer.create({
      amount,
      user: user._id,
      sendWallet:"Spot",
      reciveWallet:"AI"
    })

    await User.findByIdAndUpdate(user._id, { aiBalance: aiBalance}, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });
    await User.findByIdAndUpdate(user._id, { spotBalance: spotBalance}, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });


    await user.aiHistory.push({
      history:transfer._id,
      status:"In"
    })
    await user.spotHistory.push({
      history:transfer._id,
      status:"Out"
    })
    await user.save();

    res.status(200).json({
      success: true,
      message: "SUCCESSFULLY AMOUNT TRANSFERED"
    });
  }
  if(wallet==="Funding"){
    const fundingBalance = user.fundingBalance + amount;
    const spotBalance = user.spotBalance - amount;

    const transfer = await Transfer.create({
      amount,
      user: user._id,
      sendWallet:"Spot",
      reciveWallet:"Funding"
    })

    await User.findByIdAndUpdate(user._id, { fundingBalance: fundingBalance}, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });
    await User.findByIdAndUpdate(user._id, { spotBalance: spotBalance}, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });


    await user.fundingHistory.push({
      history:transfer._id,
      status:"In"
    })
    await user.spotHistory.push({
      history:transfer._id,
      status:"Out"
    })
    await user.save();

    res.status(200).json({
      success: true,
      message: "SUCCESSFULLY AMOUNT TRANSFERED"
    });
  }
})



/* ===================================================================================================== */
/* =========================== AI TRANSFER (POST) (/ai/to/spot) ================================ */
/* ===================================================================================================== */
exports.aiToSpot= catchAsyncError(async (req, res, next)=>{
  const {amount} = req.body
  const user = await User.findById(req.user.id)
  
  if(!amount){
    return next(new ErrorHandler("PLEASE ENTER A VALID AMOUNT", 401))
  }
  if(amount<=0){
    return next(new ErrorHandler("PLEASE ENTER A INTIGER AMOUNT", 401))
  }

  if(user.aiBalance < amount){
    return next(new ErrorHandler("INVALID FUND", 502))
  }

  const aiBalance = user.aiBalance - amount;
  const spotBalance = user.spotBalance + amount;

  const transfer = await Transfer.create({
    amount,
    user: user._id,
    sendWallet:"AI",
    reciveWallet:"Spot"
  })

  await User.findByIdAndUpdate(user._id, { aiBalance: aiBalance}, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  await User.findByIdAndUpdate(user._id, { spotBalance: spotBalance}, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });


  await user.aiHistory.push({
    history:transfer._id,
    status:"Out"
  })
  await user.spotHistory.push({
    history:transfer._id,
    status:"In"
  })
  await user.save();

  res.status(200).json({
    success: true,
    message: "SUCCESSFULLY AMOUNT TRANSFERED"
  });
})


/* ===================================================================================================== */
/* ============================== OTS TRANSFER (PUT) (/ots/transfer) =================================== */
/* ===================================================================================================== */
exports.otsTransfer = catchAsyncError(async (req, res, next) => {
  const { amount, reciver, charge } = req.body;
  const  sender = await User.findById(req.user._id)
  const  reciverUser  = await User.findOne({userName: reciver})

  if(!amount){
    return next(new ErrorHandler("PLEASE ENTER A VALID AMOUNT", 401))
  }
  if(amount<=0){
    return next(new ErrorHandler("PLEASE ENTER A INTIGER AMOUNT", 401))
  }
  if(JSON.stringify(sender._id) === JSON.stringify(reciverUser._id)){
    return next(new ErrorHandler("USER NOT FOUND", 404))
  }
  if(!reciverUser){
    return next(new ErrorHandler("USER NOT FOUND", 404))
  }
  

  const senderBalance = sender.fundingBalance - amount - charge
  const reciverBalance = reciverUser.fundingBalance + amount

  if(sender.fundingBalance<(amount+charge)){
    return next(new ErrorHandler("INVALID FUND", 404))
  }else{
    const ots = await OTS.create({
      reciver: reciverUser._id, 
      amount,
      sender: sender._id,
      charge
    });
    
    await User.findByIdAndUpdate(sender._id, { fundingBalance: senderBalance}, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });
    await sender.otsHistory.sent.push(ots._id)
    await sender.save()
    await User.findByIdAndUpdate(reciverUser._id, { fundingBalance: reciverBalance}, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });
    await reciverUser.otsHistory.recive.push(ots._id)
    await reciverUser.save()
    
    
    res.status(200).json({
      success: true,
      message: "SUCCESSFULLY AMOUNT TRANSFERED"
    });
  }
});

/* ===================================================================================================== */
/* ============================== TRADE OPTION (PUT) (/trade/status) =================================== */
/* ===================================================================================================== */
exports.tradeOption = catchAsyncError(async (req, res, next) => {
  const  user = await User.findById(req.user.id)
  
  if(user.aiBalance === 0){
    return next(new ErrorHandler("INVALID AI FUND", 404))
  }else{
    await User.findByIdAndUpdate(user._id, { tradeStatus: true}, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });
    res.status(200).json({
      success: true,
      message: "SUCCESSFULL"
    });
  }
});

/* ===================================================================================================== */
/* ============================== SPOT HISTORY (GET) (/spot/history) =================================== */
/* ===================================================================================================== */
exports.spotHistory = catchAsyncError(async (req, res, next) => {
  const  user = await User.findById(req.user.id).populate("spotHistory.history")
  
  const spotIn = user.spotHistory.filter((val)=>val.status === "In")
  const spotOut = user.spotHistory.filter((val)=>val.status === "Out")

  res.status(200).json({
    success: true,
    spotIn,
    spotOut
  });
});

/* ===================================================================================================== */
/* ============================ FUNDING HISTORY (GET) (/funding/history) ================================= */
/* ===================================================================================================== */
exports.fundingHistory = catchAsyncError(async (req, res, next) => {
  const  user = await User.findById(req.user.id).populate("fundingHistory.history")
  
  const fundingIn = user.fundingHistory.filter((val)=>val.status === "In")
  const fundingOut = user.fundingHistory.filter((val)=>val.status === "Out")

  res.status(200).json({
    success: true,
    fundingIn,
    fundingOut
  });
});

/* ===================================================================================================== */
/* ============================ AI HISTORY (GET) (/ai/history) ================================= */
/* ===================================================================================================== */
exports.aiHistory = catchAsyncError(async (req, res, next) => {
  const  user = await User.findById(req.user.id).populate("aiHistory.history")
  
  const aiIn = user.aiHistory.filter((val)=>val.status === "In")
  const aiOut = user.aiHistory.filter((val)=>val.status === "Out")

  res.status(200).json({
    success: true,
    aiIn,
    aiOut
  });
});


/* ===================================================================================================== */
/* ===================== TEAM BONUS HISTORY (GET) (/team/bonus/history) ====================== */
/* ===================================================================================================== */
exports.teamBonus = catchAsyncError(async (req, res, next) => {
  // const  user = await User.findById(req.user._id).populate("teamBonus")
  // const bonus = user.teamBonus

  const apifeatures = new ApiFetaures(Bonus.find(), req.query).search();
  const bonus = await apifeatures.query;

  res.status(200).json({
    success: true,
    bonus
  });
});


/* ===================================================================================================== */
/* ===================== WITHDRAW HISTORY (GET) (/withdraw/history) ====================== */
/* ===================================================================================================== */
exports.withdrawHistory = catchAsyncError(async (req, res, next) => {
  const  withdraw = await Withdraw.find({user:req.user._id})


  res.status(200).json({
    success: true,
    withdraw
  });
});

/* ===================================================================================================== */
/* ============================ OTS P2P HISTORY (GET) (/ots/history) ================================= */
/* ===================================================================================================== */
exports.otsHistory = catchAsyncError(async (req, res, next) => {
  const  user = await User.findById(req.user.id).populate({
    path: "otsHistory",
    populate: {
      path: "sent",
      populate: {
        path: "reciver",
        options: { strictPopulate: false },
      },
    },
  }).populate({
    path: "otsHistory",
    populate: {
      path: "recive",
      populate: {
        path: "sender",
        options: { strictPopulate: false },
      },
    },
  })

  const otsSent = user.otsHistory.sent
  const otsRecive = user.otsHistory.recive
  res.status(200).json({
    success: true,
    sentHistory:otsSent,
    reciveHistory:otsRecive
    
  });
});


/* ===================================================================================================== */
/* ============================ DIRRECT REFFERAL (GET) (/dirrect/refferal) ================================= */
/* ===================================================================================================== */
exports.directRefferal = catchAsyncError(async (req, res, next) => {
  const  user = await User.findById(req.user.id).populate("team")

  const directTeam = user.team.length;

  var refferalBalance = 0;
  for(var i=0; i<user.team.length; i++){
    refferalBalance +=  user.team[i].aiBalance
  }

  res.status(200).json({
    success: true,
    refferal:directTeam,
    turnover:refferalBalance
  });
});

/* ===================================================================================================== */
/* ============================ TEAM MEMBER (GET) (/team/member) ================================= */
/* ===================================================================================================== */
exports.teamMember = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate("team").populate({
    path: "team",
    populate: {
      path: "team",
      options: { strictPopulate: false },
    },
  }).populate({
    path: "team",
    populate: {
      path: "team",
      populate:{
        path:"team",
        options: { strictPopulate: false },
      }
    },
  }).populate({
      path: "team",
      populate: {
        path: "team",
        populate:{
          path:"team",
          populate:{
            path:"team",
            options: { strictPopulate: false },
          }
        }
      },
    }).populate({
      path: "team",
      populate: {
        path: "team",
        populate:{
          path:"team",
          populate:{
            path:"team",
            populate:{
              path:"team",
              options: { strictPopulate: false },
            }
          }
        }
      },
    })


   let firstLevel = user.team.length;
   let secondLevel = 0
   let thirdLevel = 0
   let fourLevel = 0
   let fiveLevel = 0

   //SECOND LEVEL LOOP
   for(var i=0; i<user.team.length; i++){
    for(var j=0; j<user.team[i].team.length; j++){
      secondLevel = secondLevel + j + 1
    }
   }
   

   //THIRD LEVEL LOOP
   for(var i=0; i<user.team.length; i++){
    for(var j=0; j<user.team[i].team.length; j++){
      for(var k=0; k<user.team[i].team[j].team.length; k++){
        thirdLevel = thirdLevel + k + 1
      }
    }
   }


   //FOUR LEVEL LOOP
   for(var i=0; i<user.team.length; i++){
    for(var j=0; j<user.team[i].team.length; j++){
      for(var k=0; k<user.team[i].team[j].team.length; k++){
        for(var l=0; l<user.team[i].team[j].team[k].team.length; l++){
          fourLevel = fourLevel + l + 1
        }
      }
    }
   }

   //FIVE LEVEL LOOP
   for(var i=0; i<user.team.length; i++){
    for(var j=0; j<user.team[i].team.length; j++){
      for(var k=0; k<user.team[i].team[j].team.length; k++){
        for(var l=0; l<user.team[i].team[j].team[k].team.length; l++){
          for(var m=0; m<user.team[i].team[j].team[k].team[l].team.length; m++){
            fiveLevel = fiveLevel + m + 1
          }
        }
      }
    }
   }

   let firstLevelMember = firstLevel
   let secondLevelMember;
   let thirdLevelMember;
   let fourLevelMember;
   let fiveLevelMember;
  
  if(secondLevel <= 0){
    secondLevelMember = 0
  }else{
    secondLevelMember = secondLevel - firstLevelMember
  }

  if(thirdLevel <= 0){
    thirdLevelMember = 0
  }else{
    thirdLevelMember = thirdLevel - secondLevelMember
  }

  if(fourLevel <= 0){
    fourLevelMember = 0
  }else{
    fourLevelMember = fourLevelMember - thirdLevelMember
  }

  if(fiveLevel <= 0){
    fiveLevelMember = 0
  }else{
    fiveLevelMember = fiveLevel - fourLevelMember
  }


  const totalTeam = secondLevelMember + thirdLevelMember + fourLevelMember + fiveLevelMember

  res.status(200).json({
    success: true,
    totalTeam
  });
});

/* ===================================================================================================== */
/* ============================ TEAM TURNOVER (GET) (/team/turnover) ================================= */
/* ===================================================================================================== */
exports.teamTurnover = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate("team").populate({
    path: "team",
    populate: {
      path: "team",
      options: { strictPopulate: false },
    },
  }).populate({
    path: "team",
    populate: {
      path: "team",
      populate:{
        path:"team",
        options: { strictPopulate: false },
      }
    },
  }).populate({
      path: "team",
      populate: {
        path: "team",
        populate:{
          path:"team",
          populate:{
            path:"team",
            options: { strictPopulate: false },
          }
        }
      },
    }).populate({
      path: "team",
      populate: {
        path: "team",
        populate:{
          path:"team",
          populate:{
            path:"team",
            populate:{
              path:"team",
              options: { strictPopulate: false },
            }
          }
        }
      },
    })

    
    let secondLevel = 0;
    let thirdLevel = 0;
    let fourLevel = 0;
    let fiveLevel = 0; 

    //SECOND LEVEL LOOP
    for(var i=0; i<user.team.length; i++){
      for(var j=0; j<user.team[i].team.length; j++){
        secondLevel += user.team[i].team[j].aiBalance
      }
    }

    //THIRD LEVEL LOOP
    for(var i=0; i<user.team.length; i++){
      for(var j=0; j<user.team[i].team.length; j++){
        for(var k=0; k<user.team[i].team[j].team.length; k++){
          thirdLevel += user.team[i].team[j].team[k].aiBalance
        }
      }
    }

    //FOUR LEVEL LOOP
    for(var i=0; i<user.team.length; i++){
      for(var j=0; j<user.team[i].team.length; j++){
        for(var k=0; k<user.team[i].team[j].team.length; k++){
          for(var l=0; l<user.team[i].team[j].team[k].team.length; l++){
            fourLevel += user.team[i].team[j].team[k].team[l].aiBalance
          }
        }
      }
    }

    //FIVE LEVEL LOOP
    for(var i=0; i<user.team.length; i++){
      for(var j=0; j<user.team[i].team.length; j++){
        for(var k=0; k<user.team[i].team[j].team.length; k++){
          for(var l=0; l<user.team[i].team[j].team[k].team.length; l++){
            for(var m=0; m<user.team[i].team[j].team[k].team[l].team.length; m++){
              fiveLevel += user.team[i].team[j].team[k].team[l].team[m].aiBalance
            }
          }
        }
      }
    }


    const totalTeamTurnOver = secondLevel + thirdLevel + fourLevel + fiveLevel
    
    res.status(200).json({
    success: true,
    turnover : totalTeamTurnOver
  });
});


/* ===================================================================================================== */
/* ============================ EXCHANGE (PUT) (/exchange) ================================= */
/* ===================================================================================================== */
exports.exchange = catchAsyncError(async (req, res, next) => {
  const {first, tax, second} = req.body;
  const user = await User.findById(req.user._id)

  if(first<1000){
    return next(new ErrorHandler("MINIMUM LIMIT 1000 COIN", 401))
  }

  if(first + tax < 1050){
    return next(new ErrorHandler("MINIMUM TAX + COIN EXCHANGE 1050", 401))
  }

  if(second < 10){
    return next(new ErrorHandler("MINIMUM LIMIT 10 USDT", 401))
  }

  if(user?.coinBalance < first + tax){
    return next(new ErrorHandler("NOT ENOUGH COIN", 401))
  }
  let newCoin = user.coinBalance - first - tax
  let balance = user.fundingBalance + second

  await Exchange.create({
    coin:first,
    currency:second,
    tax:tax,
    user: user._id
  })
  await User.findByIdAndUpdate(user._id, { coinBalance: newCoin, fundingBalance: balance}, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
 
  res.status(200).json({
    success: true,
    message:"EXCHANGED COIN"
  });
});