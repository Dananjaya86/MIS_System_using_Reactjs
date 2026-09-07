const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const verifyToken = require("../authMiddleware");




//  Get all admins
router.get("/", verifyToken, adminController.getAllAdmins);

// Generate new employee number 
router.get("/generate/:lastName", verifyToken, adminController.generateEmployeeNo);

// Get admin by employee number


//  Add new admin
router.post("/add", verifyToken, adminController.addAdmin);

// Update admin with employee number 
router.put("/update/:employeeNo", verifyToken, adminController.updateAdmin);

//  delete admin with employee number 
router.put("/delete/:employeeNo", verifyToken, adminController.deleteAdmin);

router.get( "/check-username",  verifyToken,  adminController.checkUsername);

router.put( "/reset-password/:employeeNo", verifyToken, adminController.resetPassword);

router.get("/:employeeNo", verifyToken, adminController.getAdminById);

module.exports = router;

