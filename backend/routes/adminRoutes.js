const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

router.post("/", adminController.addAdmin);                       // Add new admin
router.get("/", adminController.getAdmins);                       // Get all admins
router.get("/:employeeNo", adminController.getAdminById);         // Get admin by employeeNo
router.put("/", adminController.updateAdmin);                    // Update admin (body contains employeeNo)
router.delete("/:employeeNo", adminController.deleteAdmin);      // Delete admin

module.exports = router;
