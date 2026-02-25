const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

// Request approval (Customer)
router.post("/request-approval", orderController.createOrderRequest);

// Get pending requests (Admin)
router.get("/admin/pending", orderController.getPendingRequests);

// Get all requests (Admin)
router.get("/admin/all", orderController.getAllRequests);

// Accept request (Admin)
router.put("/admin/:id/accept", orderController.acceptOrderRequest);

// Reject request (Admin)
router.put("/admin/:id/reject", orderController.rejectOrderRequest);

// Get requests for customer (Notifications/Cart)
router.get("/customer/:userId", orderController.getCustomerRequests);

module.exports = router;
