const express=require('express');
const { register, login, getProfile, updateProfile } = require('../controller/Auth');
const auth = require('../middleware/middleware');
const router=express.Router();

router.post('/register',register)
router.post('/login',login)
router.get("/profile", auth, getProfile);
router.put("/updateProfile", auth, updateProfile);

module.exports=router;