
const express = require("express");
const router = express.Router();
const loginController = require("../controllers/loginController");

router.post("/",loginController.login);

router.post("/forgot-username", loginController.forgotUsername);

router.post("/forgot-password", loginController.forgotPassword);

module.exports = router;



