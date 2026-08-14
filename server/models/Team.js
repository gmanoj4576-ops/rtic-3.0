const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  registerNumber: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true }
}, { _id: false });

const teamSchema = new mongoose.Schema({
  teamId: { type: String, required: true, unique: true },
  teamName: { type: String, required: true, unique: true, trim: true },
  projectName: { type: String, trim: true },
  college: { type: String, required: true, trim: true },
  department: { type: String, required: true, trim: true },
  
  leader: {
    name: { type: String, required: true, trim: true },
    registerNumber: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true }
  },
  
  member2: memberSchema,
  member3: memberSchema,
  member4: memberSchema,
  
  payment: {
    type: String,
    default: 'UPI'
  },
  transactionId: { type: String, required: true, unique: true, trim: true },
  paymentScreenshot: { type: String, required: true }, // stores path to uploaded file
  
  registrationDate: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  amount: { type: Number, default: 1400 }
});

// Create indexes to speed up lookup for duplicate checks
teamSchema.index({ 'leader.email': 1 });
teamSchema.index({ 'leader.registerNumber': 1 });
teamSchema.index({ 'member2.email': 1 });
teamSchema.index({ 'member2.registerNumber': 1 });
teamSchema.index({ 'member3.email': 1 });
teamSchema.index({ 'member3.registerNumber': 1 });
teamSchema.index({ 'member4.email': 1 });
teamSchema.index({ 'member4.registerNumber': 1 });

module.exports = mongoose.model('Team', teamSchema);
