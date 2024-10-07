const express = require("express");
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const { setUpBot, getAllBot, activateBot } = require("../controllers/botController");

/* ====================== BOT CONFIGURATION ======================= */
router.route("/set/up/bot").post(setUpBot)
router.route("/get/all/bot").get(getAllBot)
router.route("/activate/bot/:id").put(activateBot)

module.exports  = router