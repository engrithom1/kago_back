const express = require('express')
const router = express.Router();

const checker = require("../middleware/authMiddleware");
const bundle = require("../middleware/bundleMiddleware");
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const packageController = require("../controllers/packageController");
const branchController = require("../controllers/branchController");
const packageTagController = require("../controllers/packageTagController");
const adminController = require("../controllers/adminController");


///admi functions 
router.get("/admin/top-companies",checker.ensureAuthenticated, adminController.topCompanies);
router.get("/admin/active-companies",checker.ensureAuthenticated, adminController.activeCompanies);
router.get("/admin/expired-companies",checker.ensureAuthenticated, adminController.expiredCompanies);
router.post("/admin/activate-subscription",checker.ensureAuthenticated, adminController.activateSubscription);
router.post("/admin/company-data",checker.ensureAuthenticated, adminController.companyData);
router.post("/admin/company-status",checker.ensureAuthenticated, adminController.companyStatus);
router.post("/admin/smscode-update",checker.ensureAuthenticated, adminController.companySMSCode);

router.get("/admin/dashbord-data", checker.ensureAuthenticated, adminController.dashbordData);

//////////////authentication
router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.post("/auth/logout", authController.logout);
//router.post("/auth/logout",checker.ensureAuthenticated, authController.logout);
router.post("/change-password",checker.ensureAuthenticated, authController.changePassword);

router.post("/user/update",checker.ensureAuthenticated, userController.updateStaff);
router.post("/user/delete",checker.ensureAuthenticated, userController.deleteStaff);
router.post("/user/staff-create",checker.ensureAuthenticated,bundle.checkStaff, userController.createStaff);
router.get("/user/all-staff",checker.ensureAuthenticated, userController.staffMembers);
router.get("/user/top-customers",checker.ensureAuthenticated, userController.topCustomers);
router.post("/user/search-customers",checker.ensureAuthenticated, userController.searchCustomers);
router.post("/user/filter-customers",checker.ensureAuthenticated, userController.filterCustomers);
router.post("/user/customer-events",checker.ensureAuthenticated, userController.customerEvents);

router.post("/user/create-account",userController.createAccount);
//////send messages
router.post("/sms/multiple",checker.ensureAuthenticated, packageController.sendMultSMS);
///////dashbord menu 
router.get("/dashbord-data",checker.ensureAuthenticated, packageController.dashbordData);
router.get("/profile/company-profile",checker.ensureAuthenticated, packageController.companyProfile);


//////////packages//////////// getReceiptData
router.post("/parcel/print-receipt",checker.ensureAuthenticated, packageController.getReceiptData);
router.post("/parcel/delete",checker.ensureAuthenticated, packageController.removePackage);
router.post("/parcel/receive",checker.ensureAuthenticated, packageController.receivePackage);
router.post("/parcel/create",checker.ensureAuthenticated, bundle.checkParcels, packageController.createPackage);
router.post("/parcel/update",checker.ensureAuthenticated, packageController.updatePackage);
router.get("/parcel/incomming",checker.ensureAuthenticated, packageController.incomingPackages);
router.get("/parcel/outgoing",checker.ensureAuthenticated, packageController.outgoingPackages);
router.post("/parcel/outgoing-filter",checker.ensureAuthenticated, packageController.outgoingFilterPackages);

////////////reports///////////////////////////////////
router.get("/report/revenue",checker.ensureAuthenticated, packageController.revenueReports);
router.post("/report/revenue-filter",checker.ensureAuthenticated, packageController.filterRevenueReports);
router.get("/report/transit",checker.ensureAuthenticated, packageController.transitReports);
router.post("/report/received-filter",checker.ensureAuthenticated, packageController.filterReceivedPackages);
router.get("/report/received",checker.ensureAuthenticated, packageController.receivedReports);
router.post("/report/removed-filter",checker.ensureAuthenticated, packageController.filterRemovedPackages);
router.get("/report/removed",checker.ensureAuthenticated, packageController.removedReports);


///messages report
router.get("/report/messages",checker.ensureAuthenticated, packageController.messageReports);
router.post("/report/messages-filter",checker.ensureAuthenticated, packageController.filterMessageReports);

/////////branchs///////////
router.post("/branch/create",checker.ensureAuthenticated,bundle.checkBranch, branchController.createBranch);
router.post("/branch/update",checker.ensureAuthenticated, branchController.updateBranch);
router.post("/branch/delete",checker.ensureAuthenticated, branchController.deleteBranch);

router.get("/branch/all-branches",checker.ensureAuthenticated, branchController.allBranches);
router.get("/branch/other-branches",checker.ensureAuthenticated, branchController.otherBranches);
router.get("/branch/all-regions",checker.ensureAuthenticated, branchController.allRegion);
router.post("/branch/users-and-statistics",checker.ensureAuthenticated, branchController.usersAndStatistics);

//////////Tags/////////////
router.post("/tag/create",checker.ensureAuthenticated, packageTagController.createTag);
router.post("/tag/update",checker.ensureAuthenticated, packageTagController.updateTag);
router.post("/tag/delete",checker.ensureAuthenticated, packageTagController.deleteTag);

router.get("/tag/all-tags",checker.ensureAuthenticated, packageTagController.allTags);
router.get("/tag/default-tags",checker.ensureAuthenticated, packageTagController.defaultTags);
router.get("/tag/custom-tags",checker.ensureAuthenticated, packageTagController.customTags);

module.exports = router; 