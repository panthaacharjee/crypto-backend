const express = require("express");
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const { registerUser, loginUser, logout, forgotPassword, resetPassword, getUserDetails, userVerification, sentUpdatePasswordToken, updatePassword, updateProfile, updateAvatar, depositUser, withdrawUser, fundingToSpot, spotTransfer, aiToSpot, otsTransfer, tradeOption, spotHistory, fundingHistory, aiHistory, otsHistory, directRefferal, teamMember, teamTurnover, allDepositUser, teamBonus, withdrawHistory, exchange } = require("../controllers/userController");


/* ====================== USER AUTHENTICATION ======================= */
router.route("/register/user").post(registerUser)
router.route("/login/user").post(loginUser)
router.route("/logout").get(logout)
router.route("/password/forgot").post(forgotPassword);
router.route("/password/reset/:token").put(resetPassword);
router.route("/profile/me").get(isAuthenticatedUser, getUserDetails);




/* ===================== USER UPDATATION ====================== */
router.route("/user/verification").put(isAuthenticatedUser, authorizeRoles("user"), userVerification)
router.route("/sent/password/token").get(isAuthenticatedUser, authorizeRoles("user"), sentUpdatePasswordToken)
router.route("/update/password").put(isAuthenticatedUser, authorizeRoles("user"), updatePassword)
router.route("/profile/update").put(isAuthenticatedUser, authorizeRoles("user"), updateProfile)
router.route("/avatar/update").put(isAuthenticatedUser, authorizeRoles("user"), updateAvatar)




/* ==================== USER WALLET ========================= */
router.route("/user/deposit").post(isAuthenticatedUser, authorizeRoles("user"), depositUser)
router.route("/user/all/deposit").get(isAuthenticatedUser, authorizeRoles("user"), allDepositUser)
router.route("/user/withdraw").post(isAuthenticatedUser, authorizeRoles("user"), withdrawUser)
router.route("/funding/to/spot").put(isAuthenticatedUser, authorizeRoles("user"), fundingToSpot)
router.route("/spot/transfer").put(isAuthenticatedUser, authorizeRoles("user"), spotTransfer)
router.route("/ai/to/spot").put(isAuthenticatedUser, authorizeRoles("user"), aiToSpot)
router.route("/ots/transfer").put(isAuthenticatedUser, authorizeRoles("user"), otsTransfer)
router.route("/spot/history").get(isAuthenticatedUser, authorizeRoles("user"), spotHistory)
router.route("/funding/history").get(isAuthenticatedUser, authorizeRoles("user"), fundingHistory)
router.route("/ai/history").get(isAuthenticatedUser, authorizeRoles("user"), aiHistory)
router.route("/ots/history").get(isAuthenticatedUser, authorizeRoles("user"), otsHistory)
router.route("/withdraw/history").get(isAuthenticatedUser, authorizeRoles("user"), withdrawHistory)
router.route("/team/bonus/history").get(isAuthenticatedUser, authorizeRoles("user"), teamBonus)
router.route("/exchange").put(isAuthenticatedUser, authorizeRoles("user"), exchange)

/* ==================== TEAM MANAGEMENT ========================= */
router.route("/dirrect/refferal").get(isAuthenticatedUser, authorizeRoles("user"), directRefferal)
router.route("/team/member").get(isAuthenticatedUser, authorizeRoles("user"), teamMember)
router.route("/team/turnover").get(isAuthenticatedUser, authorizeRoles("user"), teamTurnover)

/* ==================== USER BOT ========================= */
router.route("/trade/status").put(isAuthenticatedUser, authorizeRoles("user"), tradeOption)


module.exports = router