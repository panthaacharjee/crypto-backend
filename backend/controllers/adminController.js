const catchAsyncError = require("../middleware/catchAsyncError");
const crypto = require("crypto")
const ErrorHandler = require("../utils/errorhandler");
const sendToken = require("../utils/jwtToken");
const sendMail = require("../utils/sendMail");
const cloudinary = require("cloudinary");


/* ============ MODELS IMPORT ============== */
const User  = require("../models/USER/userModel")
const Admin = require("../models/ADMIN/adminModel")
const KYC = require("../models/USER/kycModel")
const Deposit = require("../models/USER/depositModel")
const Withdraw = require("../models/USER/withdrawModel")




/* ===================================================================================================== */
/* ======================== ADMIN REGISTRATION (POST) (/admin/registration) ============================ */
/* ===================================================================================================== */
exports.registerAdmin = catchAsyncError(async (req, res, next) => {
    const { userName, name, email, password } = req.body;
    const emailUser = await Admin.findOne({ email });
    if (emailUser) {
      return next(new ErrorHandler("THIS USER ALREADY EXIST", 400));
    }
  
    // const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
    //   folder: "avatars",
    //   width: 300,
    //   height: 300,
    //   crop: "scale",
    // });
    await Admin.create({
      name,
      userName, 
      email,
      password, 
    });
  
    res.status(200).json({
      success: true,
      message: `SUCCESSFULLY ADMIN CREATED`,
    });
    
});

/* ===================================================================================================== */
/* ================== BALANCE AND USER MANAGEMENT (GET) (/balance/management) ========================== */
/* ===================================================================================================== */
exports.balanceManagement = catchAsyncError(async (req, res, next) => {
  const deposit = await  Deposit.find()
  const withdraw = await Withdraw.find()
  const users = await User.find()
  const kyc  = await KYC.find()

  /* Pending Deposit */
  const pendingDeposit = deposit.filter((val)=>val.status === "Pending")
  const totalPendingDeposit = pendingDeposit.length
  let pendingDepositBalance = 0
  for(var i=0; i<pendingDeposit.length; i++){
    pendingDepositBalance += pendingDeposit[i].amount
  }

  /* Pending Withdraw */
  const pendingWithdraw = withdraw.filter((val)=>val.status === "Pending")
  const totalPendingWithdraw = pendingWithdraw.length
  let pendingWithdrawBalance = 0
  for(var i=0; i<pendingWithdraw.length; i++){
      pendingWithdrawBalance += pendingWithdraw[i].amount
  }

  /* Total User */
  const totalUser = users.length;

  /* Total Pending KYC */
  const pendingKyc = kyc.filter((val)=>val.status === "Pending")
  const totalPendingKyc = pendingKyc.length

  res.status(200).json({
    success: true,
    totalPendingDeposit,
    pendingDepositBalance,
    totalPendingWithdraw,
    pendingWithdrawBalance,
    totalUser,
    totalPendingKyc
  });
});


/* ===================================================================================================== */
/* ======================== ALL DEPOSIT REQUEST (GET) (/all/deposit) ============================ */
/* ===================================================================================================== */
exports.depositRequest = catchAsyncError(async (req, res, next) => {
    const deposit = await  Deposit.find().populate("user")
    res.status(200).json({
      success: true,
      deposit
    });
});


/* ===================================================================================================== */
/* ======================== PENDING DEPOSIT (GET) (/pending/deposit) ============================ */
/* ===================================================================================================== */
exports.pendingDeposit = catchAsyncError(async (req, res, next) => {
  const depositAll = await  Deposit.find().populate("user")
  let deposit =[]
  for(var i=0; i<depositAll.length; i++){
    if(depositAll[i].status==="Pending"){
      deposit.push(depositAll[i])
    }
  }
  res.status(200).json({
    success: true,
    deposit
  });
});

/* ===================================================================================================== */
/* ======================== LOAD USER BALANCE (POST) (/load/user/deposit) ============================ */
/* ===================================================================================================== */
exports.loadUserDeposit = catchAsyncError(async (req, res, next) => {
  const { userId, amount, status, depositId} = req.body;
  const user = await User.findById(userId)
  const deposit = await Deposit.findById(depositId)
 
  if(!user){
    return next(new ErrorHandler("USER NOT FOUND", 404))
  }
  if(!deposit){
    return next(new ErrorHandler("DEPOSIT NOT FOUND", 404))
  }

  if(status==="Paid"){
    const userBalance = user.fundingBalance + amount
    const newUserData = {
      fundingBalance: userBalance
    }
    const depositStatus = {
        status: status
    }
    await User.findByIdAndUpdate(user._id, newUserData, {
          new: true,
          runValidators: true,
          useFindAndModify: false,
        });
    await Deposit.findByIdAndUpdate(deposit._id, depositStatus, {
          new: true,
          runValidators: true,
          useFindAndModify: false,
    });
  } else if(status ==="Rejected"){
    const depositStatus = {
      status: "Reject"
    }
    await Deposit.findByIdAndUpdate(deposit._id, depositStatus, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });
  }else{
    return next(new ErrorHandler("SOMETHING WENT WRONG", 401))
  }

  res.status(200).json({
    success: true,
    message: `SUCCESSFULLY DEPOSIT LOADED`,
  });
});

/* ===================================================================================================== */
/* ======================== ALL WITHDRAW REQUEST (GET) (/all/withdraw) ============================ */
/* ===================================================================================================== */
exports.withdrawRequest = catchAsyncError(async (req, res, next) => {
  const withdraw = await  Withdraw.find().populate("user")
  res.status(200).json({
    success: true,
    withdraw
  });
});

/* ===================================================================================================== */
/* ======================== PENDING WITHDRAW (GET) (/pending/withdraw) ============================ */
/* ===================================================================================================== */
exports.pendingWithdraw = catchAsyncError(async (req, res, next) => {
  const withdrawAll = await  Withdraw.find().populate("user")
  let withdraw =[]
  for(var i=0; i<withdrawAll.length; i++){
    if(withdrawAll[i].status==="Pending"){
      withdraw.push(withdrawAll[i])
    }
  }
  res.status(200).json({
    success: true,
    withdraw
  });
});

/* ===================================================================================================== */
/* ======================== LOAD USER WITHDRAW (POST) (/load/user/withdraw) ============================ */
/* ===================================================================================================== */
exports.loadUserWithdraw = catchAsyncError(async (req, res, next) => {
  const { userId, amount, status, withdrawId} = req.body;
  const user = await User.findById(userId)
  const withdraw = await Withdraw.findById(withdrawId)
  
  if(!user){
    return next(new ErrorHandler("USER NOT FOUND", 404))
  }
  if(!withdraw){
    return next(new ErrorHandler("WIHTDRAW NOT FOUND", 404))
  }
  
  if(status==="Paid"){
    const withdrawStatus = {
        status: status
    }
   
    await Withdraw.findByIdAndUpdate(withdraw._id, withdrawStatus, {
          new: true,
          runValidators: true,
          useFindAndModify: false,
    });
  } else if(status ==="Reject"){
    const userBalance = user.fundingBalance + amount
    const newUserData = {
      fundingBalance:userBalance
    }
    const withdrawStatus = {
      status: "Rejected"
    }
    await User.findByIdAndUpdate(user._id, newUserData, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });
    await Withdraw.findByIdAndUpdate(withdraw._id, withdrawStatus, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });
  }else{
    return next(new ErrorHandler("SOMETHING WENT WRONG", 401))
  }
  
  res.status(200).json({
    success: true,
    message: `SUCCESSFULLY WITHDRAW LOADED`,
  });
});

/* ===================================================================================================== */
/* ======================== ALL USERS (GET) (/all/users) ============================ */
/* ===================================================================================================== */
exports.allUsers = catchAsyncError(async (req, res, next) => {
  const users = await User.find()
  
  res.status(200).json({
    success: true,
    users
  });
});

/* ===================================================================================================== */
/* ======================== GET ALL KYC (GET) (/all/users/kyc) ============================ */
/* ===================================================================================================== */
exports.getAllKyc = catchAsyncError(async (req, res, next) => {
  const kyc = await  KYC.find().populate("user")
  res.status(200).json({
    success: true,
    kyc
  });
});

/* ===================================================================================================== */
/* ======================== GET PENDING KYC (GET) (/pending/users/kyc) ============================ */
/* ===================================================================================================== */
exports.getPendingKyc = catchAsyncError(async (req, res, next) => {
  const kycAll = await  KYC.find().populate("user")
  const kyc = []
  for(var i=0; i<kycAll.length; i++){
    if(kycAll[i].status ==="Pending"){
      kyc.push(kycAll[i])
    }
  }
  res.status(200).json({
    success: true,
    kyc
  });
});

/* ===================================================================================================== */
/* ============================== UPDATE USER KYC  (PUT) (/update/kyc) ================================== */
/* ===================================================================================================== */
exports.updateKYC = catchAsyncError(async (req, res, next) => {
  const user = await  User.findById(req.body.id)
  const kyc = await KYC.findById(req.body.kyc)
  
  if(!user){
    return next(new ErrorHandler("USER NOT FOUND", 404))
  }

  if(!kyc){
    return next(new ErrorHandler("KYC NOT FOUND", 404))
  }

  if(req.body.status === "Complete"){
    await User.findByIdAndUpdate(user._id, {kycStatus:"Complete"}, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });
  }else if(req.body.status === "Reject"){
    await User.findByIdAndUpdate(user._id, {kycStatus:"Rejected"}, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });
  }else{
    return next(new ErrorHandler("PLEASE SELECT VALID STATUS", 404))
  }

  res.status(200).json({
    success: true,
    message:"SUCCESSFULLY KYC UPDATED"
  });
});