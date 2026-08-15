const mongoose = require('mongoose');

const day1Schema = new mongoose.Schema({
  problemIdentification: { type: Number, default: 0, min: 0, max: 20 },
  innovationCreativity: { type: Number, default: 0, min: 0, max: 20 },
  technicalFeasibility: { type: Number, default: 0, min: 0, max: 15 },
  literatureSurvey: { type: Number, default: 0, min: 0, max: 10 },
  proposedMethodology: { type: Number, default: 0, min: 0, max: 15 },
  socialImpact: { type: Number, default: 0, min: 0, max: 10 },
  presentationSkills: { type: Number, default: 0, min: 0, max: 10 },
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
      (this.day1.problemIdentification || 0) +
      (this.day1.innovationCreativity || 0) +
      (this.day1.technicalFeasibility || 0) +
      (this.day1.literatureSurvey || 0) +
      (this.day1.proposedMethodology || 0) +
      (this.day1.socialImpact || 0) +
      (this.day1.presentationSkills || 0);
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
