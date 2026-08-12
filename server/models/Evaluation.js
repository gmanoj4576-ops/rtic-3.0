const mongoose = require('mongoose');

const day1Schema = new mongoose.Schema({
  problemClarity: { type: Number, default: 0, min: 0, max: 20 },
  innovation: { type: Number, default: 0, min: 0, max: 20 },
  feasibility: { type: Number, default: 0, min: 0, max: 20 },
  designLayout: { type: Number, default: 0, min: 0, max: 20 },
  presentation: { type: Number, default: 0, min: 0, max: 20 },
  total: { type: Number, default: 0 },
  feedback: { type: String, default: '' },
  evaluatedBy: { type: String },
  evaluatedAt: { type: Date }
}, { _id: false });

const day2Schema = new mongoose.Schema({
  technicalExecution: { type: Number, default: 0, min: 0, max: 30 },
  uiux: { type: Number, default: 0, min: 0, max: 20 },
  progressEffort: { type: Number, default: 0, min: 0, max: 20 },
  integration: { type: Number, default: 0, min: 0, max: 15 },
  collaboration: { type: Number, default: 0, min: 0, max: 15 },
  total: { type: Number, default: 0 },
  feedback: { type: String, default: '' },
  evaluatedBy: { type: String },
  evaluatedAt: { type: Date }
}, { _id: false });

const day3Schema = new mongoose.Schema({
  functionalityDemo: { type: Number, default: 0, min: 0, max: 30 },
  testingRobustness: { type: Number, default: 0, min: 0, max: 20 },
  deployment: { type: Number, default: 0, min: 0, max: 15 },
  viability: { type: Number, default: 0, min: 0, max: 15 },
  presentationPitch: { type: Number, default: 0, min: 0, max: 20 },
  total: { type: Number, default: 0 },
  feedback: { type: String, default: '' },
  evaluatedBy: { type: String },
  evaluatedAt: { type: Date }
}, { _id: false });

const evaluationSchema = new mongoose.Schema({
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
    unique: true
  },
  day1: {
    type: day1Schema,
    default: () => ({})
  },
  day2: {
    type: day2Schema,
    default: () => ({})
  },
  day3: {
    type: day3Schema,
    default: () => ({})
  },
  overallTotal: {
    type: Number,
    default: 0
  }
});

// Middleware to calculate total for each day and overall total before saving
evaluationSchema.pre('save', function (next) {
  if (this.day1) {
    this.day1.total = 
      (this.day1.problemClarity || 0) +
      (this.day1.innovation || 0) +
      (this.day1.feasibility || 0) +
      (this.day1.designLayout || 0) +
      (this.day1.presentation || 0);
  }

  if (this.day2) {
    this.day2.total = 
      (this.day2.technicalExecution || 0) +
      (this.day2.uiux || 0) +
      (this.day2.progressEffort || 0) +
      (this.day2.integration || 0) +
      (this.day2.collaboration || 0);
  }

  if (this.day3) {
    this.day3.total = 
      (this.day3.functionalityDemo || 0) +
      (this.day3.testingRobustness || 0) +
      (this.day3.deployment || 0) +
      (this.day3.viability || 0) +
      (this.day3.presentationPitch || 0);
  }

  this.overallTotal = (this.day1?.total || 0) + (this.day2?.total || 0) + (this.day3?.total || 0);
  next();
});

module.exports = mongoose.model('Evaluation', evaluationSchema);
