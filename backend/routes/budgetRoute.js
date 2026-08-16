const express = require("express");

const router = express.Router();

const budgetController = require("../controllers/budgetController");

router.get("/years",budgetController.getBudgetYears);

router.get("/sales-reps",budgetController.getSalesReps);

router.get("/summary/:year",budgetController.getBudgetSummary);

router.get("/remaining/:year",budgetController.getRemainingBudget);

router.post("/add",budgetController.addBudget);

router.put("/change",budgetController.changeBudget);



module.exports = router;