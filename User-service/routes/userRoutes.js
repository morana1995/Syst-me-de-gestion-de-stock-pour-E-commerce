const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

router.get('/:email', auth, userController.getUserByEmail);
router.post('/register', userController.registerUser);
router.put('/:email', auth, userController.updateUser);
router.delete('/:email', auth, userController.deleteUser);
router.post('/login', userController.loginUser);

module.exports = router;
