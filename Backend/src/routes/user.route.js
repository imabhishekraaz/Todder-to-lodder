const express = require('express');
const userRouter = express.Router();
const { signupUser, loginUser, getProfile, updateProfile } = require('../controllers/user.controller');
const { updateOnlineStatus } = require('./../controllers/user.controller');
const { authenticateUser } = require('../utils/auth.util');

userRouter.post('/signup', signupUser);
userRouter.post('/login', loginUser);
userRouter.put('/update-status',authenticateUser, updateOnlineStatus);
userRouter.get('/profile',authenticateUser, getProfile)
userRouter.put('shop/profile', authenticateUser, updateProfile)

module.exports = userRouter;