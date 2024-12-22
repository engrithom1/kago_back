const express = require('express')
const router = express.Router();

const checker = require("../middleware/authMiddleware");
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const packageController = require("../controllers/packageController");
const branchController = require("../controllers/branchController");
const packageTagController = require("../controllers/packageTagController");

//////////////authentication
router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.post("/auth/logout",checker.ensureAuthenticated, authController.logout);


router.post("/user/update",checker.ensureAuthenticated, userController.updateStaff);
router.post("/user/delete",checker.ensureAuthenticated, userController.deleteStaff);
router.post("/user/staff-create",checker.ensureAuthenticated, userController.createStaff);
router.get("/user/all-staff",checker.ensureAuthenticated, userController.staffMembers);
router.get("/user/top-customers",checker.ensureAuthenticated, userController.topCustomers);
router.post("/user/search-customers",checker.ensureAuthenticated, userController.searchCustomers);
router.post("/user/customer-events",checker.ensureAuthenticated, userController.customerEvents);


//////////packages///////////
router.post("/parcel/receive",checker.ensureAuthenticated, packageController.receivePackage);
router.post("/parcel/create",checker.ensureAuthenticated, packageController.createPackage);
router.post("/parcel/update",checker.ensureAuthenticated, packageController.updatePackage);
router.get("/parcel/incomming",checker.ensureAuthenticated, packageController.incomingPackages);
router.get("/parcel/outgoing",checker.ensureAuthenticated, packageController.outgoingPackages);

/////////branchs///////////
router.post("/branch/create",checker.ensureAuthenticated, branchController.createBranch);
router.post("/branch/update",checker.ensureAuthenticated, branchController.updateBranch);
router.post("/branch/delete",checker.ensureAuthenticated, branchController.deleteBranch);

router.get("/branch/all-branches",checker.ensureAuthenticated, branchController.allBranches);
router.get("/branch/other-branches",checker.ensureAuthenticated, branchController.otherBranches);
router.get("/branch/all-regions",checker.ensureAuthenticated, branchController.allRegion);
router.get("/branch/users-and-statistics",checker.ensureAuthenticated, branchController.usersAndStatistics);

//////////Tags/////////////
router.post("/tag/create",checker.ensureAuthenticated, packageTagController.createTag);
router.post("/tag/update",checker.ensureAuthenticated, packageTagController.updateTag);
router.post("/tag/delete",checker.ensureAuthenticated, packageTagController.deleteTag);

router.get("/tag/all-tags",checker.ensureAuthenticated, packageTagController.allTags);
router.get("/tag/default-tags",checker.ensureAuthenticated, packageTagController.defaultTags);
router.get("/tag/custom-tags",checker.ensureAuthenticated, packageTagController.customTags);

module.exports = router; 