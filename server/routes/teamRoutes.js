const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const auth = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// Public route: Team Registration (includes file upload)
router.post('/register', upload.single('paymentScreenshot'), teamController.registerTeam);

// Protected routes: Admin Dashboard
router.get('/stats', auth, teamController.getStats);
router.get('/', auth, teamController.getAllTeams);
router.put('/:id/status', auth, teamController.updateTeamStatus);
router.put('/:id', auth, teamController.editTeam);
router.delete('/:id', auth, teamController.deleteTeam);

module.exports = router;
