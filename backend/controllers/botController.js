const crypto = require("crypto")
const cloudinary = require("cloudinary");
const schedule = require('node-schedule');


/* ================= UTILS AND MIDDLEWARE ==================== */
const catchAsyncError = require("../middleware/catchAsyncError");
const ErrorHandler = require("../utils/errorhandler");
const sendToken = require("../utils/jwtToken");
const sendMail = require("../utils/sendMail");




/* ============ MODELS IMPORT ============== */
const User  = require("../models/USER/userModel")
const Admin = require("../models/ADMIN/adminModel")
const BOT = require("../models/ADMIN/botModel")
const Bonus = require("../models/USER/bonusModel")





/* ===================================================================================================== */
/* ============================= SET UP A BOT (POST) (/set/up/bot) ================================= */
/* ===================================================================================================== */

exports.setUpBot = catchAsyncError(async (req, res, next) => {
    const { startHour, startMinute, first, second, third, four, five, trade, coin } = req.body;
    
    await BOT.create({
      startHour,
      startMinute, 
      first,
      second,
      third,
      four,
      five,
      trade, 
      coin
    });
  
    res.status(200).json({
        success: true,
        message: `BOT SETUP COMPLITED`,
    });
  });

/* ===================================================================================================== */
/* ============================= GET ALL BOT (GET) (/get/all/bot) ================================= */
/* ===================================================================================================== */

exports.getAllBot = catchAsyncError(async (req, res, next) => {
   
    const bot = await BOT.find()
  
    res.status(200).json({
        success: true,
        bot,
    });
});

/* ===================================================================================================== */
/* ============================= ACTIVATE A BOT (PUT) (/activate/bot/:id) ================================= */
/* ===================================================================================================== */
exports.activateBot = catchAsyncError(async (req, res, next) => {
   
    const {id} = req.params
    const bot = await BOT.findById(id)
    if(!bot){
      return next(new ErrorHandler("BOT NOT FOUND", 404));
    }

    const bots = await BOT.find()
    
    let totalActiveBot = 0
    for(var i=0; i<bots.length; i++){
      if(bots[i].status === "Active"){
        totalActiveBot ++
      }
    }

    if(totalActiveBot>0){
      return next(new ErrorHandler("PLEASE DEACTIVE A BOT", 401));
    }

    await BOT.findByIdAndUpdate(bot._id, { status:"Active"}, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    })

  
    res.status(200).json({
        success: true,
        message:"SUCCESSFULLY BOT ACTIVATED"
    });
  });





/* ===================================================================================================== */
/* ===================================== UPDATE TRADE   ====================================== */
/* ===================================================================================================== */
exports.updateUserTrade = schedule.scheduleJob({hour: 14, minute: 51, dayOfWeek: [ 1, 2, 3, 4, 5, 6]}, catchAsyncError(async function(req, res, next){
  const bot = await BOT.find()

  let activeBOT = bot.filter((val)=>val.status === "Active")

  const users = await User.find()

  for(var i=0; i<users.length; i++){
   if(users[i].tradeStatus == true){
    let trade = (users[i].aiBalance) * activeBOT[0].trade
    await User.findByIdAndUpdate(users[i]._id, {tradeIncome: trade}, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    })
   }
  }
}));

/* ===================================================================================================== */
/* ===================================== UPDATE COIN   ====================================== */
/* ===================================================================================================== */
exports.updateUserCoin = schedule.scheduleJob({hour: 14, minute: 52, dayOfWeek: [1, 2, 3, 4, 5, 6]}, catchAsyncError(async function(req, res, next){
  const bot = await BOT.find()

  let activeBOT = bot.filter((val)=>val.status === "Active")

  const users = await User.find()

  for(var i=0; i<users.length; i++){
   if(users[i].tradeStatus == true){
    let coin = (users[i].aiBalance) * activeBOT[0].coin 
    await User.findByIdAndUpdate(users[i]._id, {coinIncome: coin}, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    })
   }
  }
}));

/* ===================================================================================================== */
/* ===================================== FIRST LEVEL INCOME   ====================================== */
/* ===================================================================================================== */
exports.updateFirstLevel = schedule.scheduleJob({hour: 14, minute: 53, dayOfWeek: [1, 2, 3, 4, 5, 6]}, catchAsyncError(async function(req, res, next){
  const bot = await BOT.find()

  let activeBOT = bot.filter((val)=>val.status === "Active")

  const users = await User.find().populate("team")

  for(var i=0; i<users.length; i++){
    var income = 0;
    for(var j=0; j<users[i].team.length; j++){
      income += users[i].team[j].tradeIncome
    }

    const firstLevel = income * activeBOT[0].first
    await User.findByIdAndUpdate(users[i]._id, {firstLevelIncome:firstLevel}, {
      new: true, 
      runValidators: true,
      useFindAndModify: false,
    });
  }
}));

/* ===================================================================================================== */
/* ======================================= SECOND LEVEL INCOME   ====================================== */
/* ===================================================================================================== */
exports.updateSecondLevel = schedule.scheduleJob({hour: 14, minute: 54, dayOfWeek: [1, 2, 3, 4, 5, 6]}, catchAsyncError(async function(req, res, next){
  const bot = await BOT.find()

  let activeBOT = bot.filter((val)=>val.status === "Active")

  const users = await User.find().populate("team").populate({
    path: "team",
    populate: {
      path: "team",
      options: { strictPopulate: false },
    },
  })

  for(var i=0; i<users.length; i++){
    var income = 0;
    for(var j=0; j<users[i].team.length; j++){
      for(var k=0; k<users[i].team[j].team.length; k++){
        income += users[i].team[j].team[k].tradeIncome
      }
    }
    
    const secondLevel = income * activeBOT[0].second
    await User.findByIdAndUpdate(users[i]._id, {secondLevelIncome: secondLevel}, {
      new: true, 
      runValidators: true,
      useFindAndModify: false,
    });
  }
}));


/* ===================================================================================================== */
/* ========================================= THIRD LEVEL INCOME   ====================================== */
/* ===================================================================================================== */
exports.updateThirdLevel = schedule.scheduleJob({hour: 14, minute: 55, dayOfWeek: [1, 2, 3, 4, 5, 6]}, catchAsyncError(async function(req, res, next){
  const bot = await BOT.find()

  let activeBOT = bot.filter((val)=>val.status === "Active")

  const users = await User.find().populate("team").populate({
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
  })

  for(var i=0; i<users.length; i++){
    var income = 0;
      for(var j=0; j<users[i].team.length; j++){
        for(var k=0; k<users[i].team[j].team.length; k++){
          for(var l=0; l<users[i].team[j].team[k].team.length; l++){
            income += users[i].team[j].team[k].team[l].tradeIncome
          }
        }
      }
      
      const thirdLevel = income * activeBOT[0].third
      await User.findByIdAndUpdate(users[i]._id, {thirdLevelIncome: thirdLevel}, {
        new: true, 
        runValidators: true,
        useFindAndModify: false,
      });
  }
}));


/* ===================================================================================================== */
/* ======================================= FOUR LEVEL INCOME   ========================================= */
/* ===================================================================================================== */
exports.updateFourLevel = schedule.scheduleJob({hour: 14, minute: 56, dayOfWeek: [1, 2, 3, 4, 5, 6]}, catchAsyncError(async function(req, res, next){
  const bot = await BOT.find()

  let activeBOT = bot.filter((val)=>val.status === "Active")

  const users = await User.find().populate("team").populate({
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
    })

  for(var i=0; i<users.length; i++){
    var income = 0;
      for(var j=0; j<users[i].team.length; j++){
        for(var k=0; k<users[i].team[j].team.length; k++){
          for(var l=0; l<users[i].team[j].team[k].team.length; l++){
            for(var m=0; m<users[i].team[j].team[k].team[l].team.length; m++){
              income += users[i].team[j].team[k].team[l].team[m].tradeIncome
            }
          }
        }
      }
      
      const fourLevel = income * activeBOT[0].four
      await User.findByIdAndUpdate(users[i]._id, {fourLevelIncome: fourLevel}, {
        new: true, 
        runValidators: true,
        useFindAndModify: false,
      });
  }
}));


/* ===================================================================================================== */
/* ========================================= FIVE LEVEL INCOME   ======================================= */
/* ===================================================================================================== */
exports.updateFiveLevel = schedule.scheduleJob({hour: 14, minute: 57, dayOfWeek: [1, 2, 3, 4, 5, 6]}, catchAsyncError(async function(req, res, next){
  const bot = await BOT.find()

  let activeBOT = bot.filter((val)=>val.status === "Active")

  const users = await User.find().populate("team").populate({
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

  for(var i=0; i<users.length; i++){
    var income = 0;
    for(var j=0; j<users[i].team.length; j++){
      for(var k=0; k<users[i].team[j].team.length; k++){
        for(var l=0; l<users[i].team[j].team[k].team.length; l++){
          for(var m=0; m<users[i].team[j].team[k].team[l].team.length; m++){
            for(var n=0; n<users[i].team[j].team[k].team[l].team[m].team.length; n++){
              income += users[i].team[j].team[k].team[l].team[m].team[n].tradeIncome
            }
          }
        }
      }
    }
    
    const fiveLevel = income * activeBOT[0].five
    await User.findByIdAndUpdate(users[i]._id, {fiveLevelIncome: fiveLevel}, {
      new: true, 
      runValidators: true,
      useFindAndModify: false,
    });
  }
}));


/* ===================================================================================================== */
/* ====================================== UPDATE TEAM BONUS   ========================================== */
/* ===================================================================================================== */
exports.updateTeamBonus = schedule.scheduleJob({hour: 14, minute: 58, dayOfWeek: [1, 2, 3, 4, 5, 6]}, catchAsyncError(async function(req, res, next){
  const users = await User.find()
  
  for(var i=0; i<users.length; i++){
    const teamBonus = parseFloat(users[i].firstLevelIncome) + parseFloat(users[i].secondLevelIncome) + parseFloat(users[i].thirdLevelIncome) + parseFloat(users[i].fourLevelIncome) + parseFloat(users[i].fiveLevelIncome)
      const spotBalance = parseFloat(users[i].spotBalance) + teamBonus
      const bonus = await Bonus.create({
        title:"AI GENERATED BONUS",
        amount: teamBonus,
        description:"FIRST + SECOND + THIRD + FOUR + FIVE LEVEL AI GENERATED BONUS",
        user: users[i]._id
      })
      await User.findByIdAndUpdate(users[i]._id, {spotBalance:spotBalance}, {
        new: true, 
        runValidators: true,
        useFindAndModify: false,
      });

      await users[i].teamBonus.push(bonus._id)
      await users[i].save()
  }
}));


/* ===================================================================================================== */
/* ===================================== UPDATE TRADE + COIN BONUS ===================================== */
/* ===================================================================================================== */
exports.updateTradeBonus = schedule.scheduleJob({hour: 14, minute: 59, dayOfWeek: [1, 2, 3, 4, 5, 6]}, catchAsyncError(async function(req, res, next){
  const users = await User.find()
  
  for(var i=0; i<users.length; i++){
    const spotBalance = parseFloat(users[i].spotBalance) + parseFloat(users[i].tradeIncome)
      const coinBalance = parseFloat(users[i].coinBalance) + parseFloat(users[i].coinIncome)
      await User.findByIdAndUpdate(users[i]._id, {spotBalance:spotBalance, coinBalance: coinBalance}, {
        new: true, 
        runValidators: true,
        useFindAndModify: false,
      });
    }
}));

/* ===================================================================================================== */
/* =========================================== STOP AI BOT   =========================================== */
/* ===================================================================================================== */
exports.stopAIBOT = schedule.scheduleJob({hour: 14, minute: 60, dayOfWeek: [1, 2, 3, 4, 5, 6]}, catchAsyncError(async function(req, res, next){
  const users = await User.find()
  
  for(var i=0; i<users.length; i++){
    await User.findByIdAndUpdate(users[i]._id, {tradeStatus:false}, {
      new: true, 
      runValidators: true,
      useFindAndModify: false,
    });
  }
}));

/* ===================================================================================================== */
/* =========================================== UPDATE USER LOCAL BALANCE  =========================================== */
/* ===================================================================================================== */
exports.updateUserAllBalance = schedule.scheduleJob({hour: 15, minute: 35, dayOfWeek: [1, 2, 3, 4, 5, 6]}, catchAsyncError(async function(req, res, next){
  const users = await User.find()
  
  for(var i=0; i<users.length; i++){
    await User.findByIdAndUpdate(users[i]._id, { tradeIncome:0, coinIncome:0, firstLevelIncome:0, secondLevelIncome:0, thirdLevelIncome:0, fourLevelIncome:0, fiveLevelIncome:0}, {
      new: true, 
      runValidators: true,
      useFindAndModify: false,
    });
  }
}));
