const express = require('express')
const router = express.Router();

const mainController = require("../controllers/mainController");
const authController = require("../controllers/authController");
const checker = require("../middleware/authMiddleware");

///Page Routes
router.get("/", mainController.home);
router.get("/about", mainController.about);
router.get("/contact", mainController.contact);
router.get("/blog", mainController.blog);
router.get("/price", mainController.price);

router.get("/terms-policy", mainController.policy);
router.get("/data-safety", mainController.dataSafety);

router.get("/create-account", mainController.createAccount);

router.get("/api-doc", mainController.apiDoc);
//router.get("/terms-condition", mainController.policy);

module.exports = router; 