const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluationController');
const evaluationAuth = require('../middlewares/evaluationAuth');

// Public route: Evaluator Login
router.post('/login', evaluationController.login);

// Protected routes (Requires Evaluator Auth)
router.get('/teams', evaluationAuth, evaluationController.getTeams);
router.post('/submit', evaluationAuth, evaluationController.submitEvaluation);
router.get('/leaderboard', evaluationAuth, evaluationController.getLeaderboard);

module.exports = router;
