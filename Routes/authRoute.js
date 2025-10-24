const express=require('express');
const { register, login, getProfile, updateProfile, changePassword, logout } = require('../controller/Auth');
const auth = require('../middleware/middleware');
const admin = require('../middleware/Admin');
const router=express.Router();

router.post('/register',register)
router.post('/login',login)
router.post('/logout',auth,admin,logout)
router.put("/updateProfile", auth,admin, changePassword);
router.get("/profile", auth,admin, getProfile);
router.put("/updateProfile", auth,admin, updateProfile);

module.exports=router;