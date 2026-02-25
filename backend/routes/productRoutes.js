const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, "../uploads"); // Go up one level to backend root's uploads
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const safe = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
        cb(null, safe);
    },
});
const upload = multer({ storage });

// Route to add product (Seller) - supports image upload
router.post("/add", upload.single('image'), productController.addProduct);

// Route for admin to view pending products
router.get("/admin/pending", productController.getPendingProducts);

// Route for admin to approve product - supports image upload
router.post("/admin/approve", upload.single('image'), productController.approveProduct);

// Route for admin to reject product
router.post("/admin/reject", productController.rejectProduct);

// Route for seller to request update
router.post("/update-request", productController.requestUpdate);

// Route to get seller's products
router.get("/seller/:sellerId", productController.getSellerProducts);

// Public Marketplace Route
router.get("/marketplace", productController.getMarketplaceProducts);

// Seller delete
router.delete("/seller/delete/:id", productController.deleteProductBySeller);

// Admin notifications
router.get("/admin/notifications", productController.getNotifications);

// Get Single Product
router.get("/:id", productController.getProductById);

module.exports = router;
