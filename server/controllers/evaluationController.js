const jwt = require('jsonwebtoken');
const Team = require('../models/Team');
const Evaluation = require('../models/Evaluation');

// Evaluator login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Load credentials from environment or use default fallbacks
    const credentials = {
      [process.env.EVALUATOR_USERNAME || 'evaluator']: {
        password: process.env.EVALUATOR_PASSWORD || 'Evaluator@RTIC2026',
        role: 'evaluator'
      },
      [process.env.EVAL_ADMIN_USERNAME || 'eval_admin']: {
        password: process.env.EVAL_ADMIN_PASSWORD || 'EvalAdmin@RTIC2026',
        role: 'eval_admin'
      }
    };

    const user = credentials[username];
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid evaluator credentials' });
    }

    // Sign JWT Token for evaluator
    const payload = {
      evaluator: {
        username: username,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'fallback_secret_rtic_2026',
      { expiresIn: '12h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, username, role: user.role });
      }
    );
  } catch (error) {
    console.error('Evaluator login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all approved teams with evaluation status
exports.getTeams = async (req, res) => {
  try {
    // Only return approved teams for evaluation
    const approvedTeams = await Team.find({ status: 'approved' }).sort({ teamId: 1 });
    
    // Fetch all evaluations
    const evaluations = await Evaluation.find({});
    
    // Create an evaluation lookup map
    const evalMap = {};
    evaluations.forEach(ev => {
      evalMap[ev.teamId.toString()] = ev;
    });

    // Merge evaluations with team objects
    const result = approvedTeams.map(team => {
      const evaluation = evalMap[team._id.toString()] || {
        day1: { total: 0, feedback: '', problemClarity: 0, innovation: 0, feasibility: 0, literatureSurvey: 0, presentation: 0 },
        overallTotal: 0
      };
      
      return {
        _id: team._id,
        teamId: team.teamId,
        teamName: team.teamName,
        projectName: team.projectName || team.teamName,
        college: team.college,
        department: team.department,
        leaderName: team.leader?.name,
        evaluation: evaluation
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Fetch teams for evaluation error:', error);
    res.status(500).json({ message: 'Failed to fetch teams' });
  }
};

// Submit/Update marks
exports.submitEvaluation = async (req, res) => {
  try {
    const { teamId, day = 'day1', scores, feedback } = req.body;
    const { role, username } = req.evaluator;

    if (!teamId || !scores) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    const evaluationDay = day || 'day1';

    // Define validation criteria (out of 100 marks total)
    const criteria = {
      problemClarity: 20,
      literatureSurvey: 20,
      innovation: 20,
      feasibility: 20,
      presentation: 20
    };

    const updatedScores = {};

    // Validate marks limits
    for (const key of Object.keys(criteria)) {
      const score = Number(scores[key] || 0);
      const maxLimit = criteria[key];
      
      if (isNaN(score) || score < 0 || score > maxLimit) {
        return res.status(400).json({ 
          message: `Validation failed: Score for ${key} must be a number between 0 and ${maxLimit}` 
        });
      }
      updatedScores[key] = score;
    }

    // Check if team exists
    const teamExists = await Team.exists({ _id: teamId });
    if (!teamExists) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Upsert evaluation document
    let evaluation = await Evaluation.findOne({ teamId });
    if (!evaluation) {
      evaluation = new Evaluation({ teamId });
    }

    // Set marks, feedback, evaluator, and timestamp
    evaluation[evaluationDay] = {
      ...updatedScores,
      feedback: feedback || '',
      evaluatedBy: username,
      evaluatedAt: new Date()
    };

    await evaluation.save();

    res.json({ 
      message: 'Evaluation saved successfully!', 
      evaluation 
    });
  } catch (error) {
    console.error('Submit evaluation error:', error);
    res.status(500).json({ message: 'Server error saving evaluation' });
  }
};

// Retrieve Leaderboard sorted by total marks
exports.getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Evaluation.find({})
      .populate('teamId', 'teamId teamName projectName college department status')
      .sort({ overallTotal: -1, 'day1.total': -1 });

    // Filter out evaluations where team status is not approved, just in case
    const filteredLeaderboard = leaderboard.filter(ev => ev.teamId && ev.teamId.status === 'approved');

    res.json(filteredLeaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: 'Failed to fetch leaderboard data' });
  }
};
