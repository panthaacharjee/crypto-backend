const express = require("express");
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const { registerAdmin, depositRequest, loadUserDeposit, allUsers, getAllKyc, updateKYC, getPendingKyc, pendingDeposit, withdrawRequest, pendingWithdraw, loadUserWithdraw, balanceManagement} = require("../controllers/adminController");

/* ====================== ADMIN AUTHENTICATION ======================= */
router.route("/admin/registartion").post(registerAdmin)

/* ====================== WALLLET MANGEMENT ======================= */
router.route("/balance/management").get(balanceManagement)

router.route("/all/deposit").get(depositRequest)
router.route("/pending/deposit").get(pendingDeposit)
router.route("/load/user/deposit").post(loadUserDeposit)

router.route("/all/withdraw").get(withdrawRequest)
router.route("/pending/withdraw").get(pendingWithdraw)
router.route("/load/user/withdraw").post(loadUserWithdraw)

/* ======================= USERS MANAGEMENT ======================= */
router.route("/all/users").get(allUsers)

/* ====================== USERS KYC ========================= */
router.route("/all/users/kyc").get(getAllKyc)
router.route("/pending/users/kyc").get(getPendingKyc)
router.route("/update/kyc").put(updateKYC)


module.exports = router