const Team = require('../models/Team');
const Counter = require('../models/Counter');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Helper to send emails with error recovery
const sendNotificationEmail = async (team, type = 'received') => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[Email System] SMTP credentials not set. Skipping email for team ${team.teamId} (${type}).`);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    let subject = '';
    let htmlContent = '';

    const containerStyle = `
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #0d1117;
      color: #c9d1d9;
      padding: 30px;
      border-radius: 12px;
      max-width: 600px;
      margin: 20px auto;
      border: 1px solid #30363d;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
    `;

    const headerStyle = `
      text-align: center;
      border-bottom: 2px solid #58a6ff;
      padding-bottom: 20px;
      margin-bottom: 25px;
    `;

    const tableStyle = `
      width: 100%;
      border-collapse: collapse;
      background-color: #161b22;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #30363d;
      margin: 20px 0;
    `;

    const listStyle = `
      list-style-type: none;
      padding-left: 0;
      background-color: #161b22;
      border-radius: 8px;
      border: 1px solid #30363d;
      padding: 15px;
    `;

    if (type === 'received') {
      subject = `RTIC 3.0 Registration Received - ${team.teamName} (ID: ${team.teamId})`;
      htmlContent = `
        <div style="${containerStyle}">
          <div style="${headerStyle}">
            <h2 style="color: #58a6ff; margin: 0; font-size: 26px; text-transform: uppercase; letter-spacing: 2px;">RTIC 3.0</h2>
            <p style="color: #8b949e; margin: 5px 0 0 0; font-size: 14px;">Rural Tech Innovation Challenge 3.0</p>
          </div>
          <p>Dear <strong>${team.leader.name}</strong>,</p>
          <p>Thank you for registering your team for the <strong>Rural Tech Innovation Challenge 3.0</strong>. We have received your registration details and payment proof.</p>
          
          <table style="${tableStyle}">
            <tr>
              <td style="padding: 10px; color: #58a6ff; font-weight: bold; width: 40%;">Team ID:</td>
              <td style="padding: 10px; color: #ffffff; font-weight: bold; font-size: 16px;">${team.teamId}</td>
            </tr>
            <tr>
              <td style="padding: 10px; color: #58a6ff; font-weight: bold;">Team Name:</td>
              <td style="padding: 10px; color: #ffffff;">${team.teamName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; color: #58a6ff; font-weight: bold;">College Name:</td>
              <td style="padding: 10px; color: #ffffff;">${team.college}</td>
            </tr>
            <tr>
              <td style="padding: 10px; color: #58a6ff; font-weight: bold;">Department:</td>
              <td style="padding: 10px; color: #ffffff;">${team.department}</td>
            </tr>
            <tr>
              <td style="padding: 10px; color: #58a6ff; font-weight: bold;">Total Amount:</td>
              <td style="padding: 10px; color: #ffffff; font-weight: bold;">₹${team.amount} (₹350/member)</td>
            </tr>
            <tr>
              <td style="padding: 10px; color: #58a6ff; font-weight: bold;">Transaction ID:</td>
              <td style="padding: 10px; color: #ffffff; font-family: monospace;">${team.transactionId}</td>
            </tr>
            <tr>
              <td style="padding: 10px; color: #58a6ff; font-weight: bold;">Verification Status:</td>
              <td style="padding: 10px; color: #ffa726; font-weight: bold; text-transform: uppercase;">PENDING VERIFICATION</td>
            </tr>
          </table>

          <h3 style="color: #58a6ff; margin-top: 25px; border-bottom: 1px solid #30363d; padding-bottom: 8px;">Registered Members</h3>
          <ul style="${listStyle}">
            <li style="padding: 8px 0; border-bottom: 1px solid #21262d;"><strong>Leader:</strong> ${team.leader.name} (${team.leader.registerNumber}) - ${team.leader.email}</li>
            <li style="padding: 8px 0; border-bottom: 1px solid #21262d;"><strong>Member 2:</strong> ${team.member2.name} (${team.member2.registerNumber}) - ${team.member2.email}</li>
            <li style="padding: 8px 0; border-bottom: 1px solid #21262d;"><strong>Member 3:</strong> ${team.member3.name} (${team.member3.registerNumber}) - ${team.member3.email}</li>
            <li style="padding: 8px 0;"><strong>Member 4:</strong> ${team.member4.name} (${team.member4.registerNumber}) - ${team.member4.email}</li>
          </ul>

          <p style="margin-top: 25px; font-size: 14px; color: #8b949e;">Our admin panel is reviewing your payment details. You will receive another notification email once your registration status is updated.</p>
          <div style="text-align: center; margin-top: 40px; border-top: 1px solid #30363d; padding-top: 20px; font-size: 12px; color: #8b949e;">
            <p>© 2026 Rural Tech Innovation Challenge 3.0. All rights reserved.</p>
          </div>
        </div>
      `;
    } else if (type === 'approved') {
      subject = `RTIC 3.0 Registration APPROVED - Team ID: ${team.teamId}`;
      htmlContent = `
        <div style="${containerStyle}">
          <div style="${headerStyle}">
            <h2 style="color: #3fb950; margin: 0; font-size: 26px; text-transform: uppercase; letter-spacing: 2px;">RTIC 3.0 Approved</h2>
            <p style="color: #8b949e; margin: 5px 0 0 0; font-size: 14px;">Rural Tech Innovation Challenge 3.0</p>
          </div>
          <p>Dear <strong>${team.leader.name}</strong>,</p>
          <p>Great news! Your team registration has been **APPROVED** by the RTIC committee.</p>
          
          <table style="${tableStyle}">
            <tr>
              <td style="padding: 10px; color: #3fb950; font-weight: bold; width: 40%;">Team ID:</td>
              <td style="padding: 10px; color: #ffffff; font-weight: bold; font-size: 16px;">${team.teamId}</td>
            </tr>
            <tr>
              <td style="padding: 10px; color: #3fb950; font-weight: bold;">Team Name:</td>
              <td style="padding: 10px; color: #ffffff;">${team.teamName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; color: #3fb950; font-weight: bold;">College Name:</td>
              <td style="padding: 10px; color: #ffffff;">${team.college}</td>
            </tr>
            <tr>
              <td style="padding: 10px; color: #3fb950; font-weight: bold;">Verification Status:</td>
              <td style="padding: 10px; color: #3fb950; font-weight: bold; text-transform: uppercase;">APPROVED</td>
            </tr>
          </table>

          <p>Your receipt is ready and you are officially registered for the event. Please keep your Team ID <strong>${team.teamId}</strong> handy for all future communications and on the event day.</p>
          <div style="text-align: center; margin-top: 40px; border-top: 1px solid #30363d; padding-top: 20px; font-size: 12px; color: #8b949e;">
            <p>© 2026 Rural Tech Innovation Challenge 3.0. All rights reserved.</p>
          </div>
        </div>
      `;
    } else if (type === 'rejected') {
      subject = `RTIC 3.0 Registration Rejected - Team ID: ${team.teamId}`;
      htmlContent = `
        <div style="${containerStyle}">
          <div style="${headerStyle}">
            <h2 style="color: #f85149; margin: 0; font-size: 26px; text-transform: uppercase; letter-spacing: 2px;">RTIC 3.0 Status Update</h2>
            <p style="color: #8b949e; margin: 5px 0 0 0; font-size: 14px;">Rural Tech Innovation Challenge 3.0</p>
          </div>
          <p>Dear <strong>${team.leader.name}</strong>,</p>
          <p>Your team registration for the <strong>Rural Tech Innovation Challenge 3.0</strong> (Team ID: <strong>${team.teamId}</strong>) has been **REJECTED** due to issues with the payment verification or transaction ID.</p>
          
          <table style="${tableStyle}">
            <tr>
              <td style="padding: 10px; color: #f85149; font-weight: bold; width: 40%;">Team ID:</td>
              <td style="padding: 10px; color: #ffffff; font-weight: bold; font-size: 16px;">${team.teamId}</td>
            </tr>
            <tr>
              <td style="padding: 10px; color: #f85149; font-weight: bold;">Team Name:</td>
              <td style="padding: 10px; color: #ffffff;">${team.teamName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; color: #f85149; font-weight: bold;">Verification Status:</td>
              <td style="padding: 10px; color: #f85149; font-weight: bold; text-transform: uppercase;">REJECTED / INVALID PAYMENT</td>
            </tr>
          </table>

          <p>Please double-check your transaction ID and verify that your payment screenshot matches the calculated registration fee. You can register again or contact us at <a href="mailto:ieeeraskare@gmail.com" style="color: #58a6ff;">ieeeraskare@gmail.com</a> for support.</p>
          <div style="text-align: center; margin-top: 40px; border-top: 1px solid #30363d; padding-top: 20px; font-size: 12px; color: #8b949e;">
            <p>© 2026 Rural Tech Innovation Challenge 3.0. All rights reserved.</p>
          </div>
        </div>
      `;
    }

    const mailOptions = {
      from: `"Rural Tech Innovation Challenge 3.0" <${process.env.SMTP_USER}>`,
      to: team.leader.email,
      subject: subject,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    console.log(`[Email System] Email sent successfully for ${team.teamId} (${type}).`);
  } catch (error) {
    console.error(`[Email System] Error sending email for ${team.teamId}:`, error.message);
  }
};

// Register a new team
exports.registerTeam = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Payment screenshot is required!' });
    }

    const { teamName, college, department, transactionId } = req.body;
    
    // Parse leader and members from body (they will be sent as JSON strings or individual fields)
    let leader, member2, member3, member4;
    try {
      leader = typeof req.body.leader === 'string' ? JSON.parse(req.body.leader) : req.body.leader;
      member2 = typeof req.body.member2 === 'string' ? JSON.parse(req.body.member2) : req.body.member2;
      member3 = typeof req.body.member3 === 'string' ? JSON.parse(req.body.member3) : req.body.member3;
      member4 = typeof req.body.member4 === 'string' ? JSON.parse(req.body.member4) : req.body.member4;
    } catch (e) {
      return res.status(400).json({ message: 'Invalid member data format!' });
    }

    // Basic required validation
    if (!teamName || !college || !department || !transactionId || !leader) {
      return res.status(400).json({ message: 'Team Name, College, Department, Leader info, and Transaction ID are required!' });
    }

    // Filter active members (Leader is always required; Member 2, 3, 4 are optional if completely blank)
    const activeMembers = [];
    
    // Validate leader (Mandatory)
    if (!leader.name || !leader.registerNumber || !leader.email || !leader.phone) {
      return res.status(400).json({ message: 'All details are required for the Team Leader!' });
    }
    activeMembers.push(leader);

    // Helper to validate and add optional member
    const processOptionalMember = (m, memberLabel) => {
      if (m && (m.name || m.registerNumber || m.email || m.phone)) {
        if (!m.name || !m.registerNumber || !m.email || !m.phone) {
          throw new Error(`All details are required for ${memberLabel} if any field is filled!`);
        }
        activeMembers.push(m);
        return true;
      }
      return false;
    };

    try {
      processOptionalMember(member2, 'Member 2');
      processOptionalMember(member3, 'Member 3');
      processOptionalMember(member4, 'Member 4');
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const m of activeMembers) {
      if (!emailRegex.test(m.email)) {
        return res.status(400).json({ message: `Invalid email address: ${m.email}` });
      }
    }

    // Validate phone number (10 digits)
    const phoneRegex = /^\d{10}$/;
    for (const m of activeMembers) {
      if (!phoneRegex.test(m.phone)) {
        return res.status(400).json({ message: `Phone number must be exactly 10 digits: ${m.phone}` });
      }
    }

    // Collect all emails and register numbers
    const emails = activeMembers.map(m => m.email.toLowerCase());
    const regNums = activeMembers.map(m => m.registerNumber.trim());

    // Check internal duplicates in form
    if (new Set(emails).size !== activeMembers.length) {
      return res.status(400).json({ message: 'Duplicate emails detected within the team members!' });
    }
    if (new Set(regNums).size !== activeMembers.length) {
      return res.status(400).json({ message: 'Duplicate register numbers detected within the team members!' });
    }

    // 1. Check database for duplicate Team Name
    const existingTeamName = await Team.findOne({ teamName: teamName.trim() });
    if (existingTeamName) {
      return res.status(400).json({ message: `Team Name '${teamName}' is already taken!` });
    }

    // 2. Check database for duplicate Transaction ID
    const existingTx = await Team.findOne({ transactionId: transactionId.trim() });
    if (existingTx) {
      return res.status(400).json({ message: `Transaction ID '${transactionId}' has already been registered!` });
    }

    // 3. Check database for duplicate Emails
    const emailDup = await Team.findOne({
      $or: [
        { 'leader.email': { $in: emails } },
        { 'member2.email': { $in: emails } },
        { 'member3.email': { $in: emails } },
        { 'member4.email': { $in: emails } }
      ]
    });
    if (emailDup) {
      return res.status(400).json({ message: 'One or more member emails are already registered in another team!' });
    }

    // 4. Check database for duplicate Register Numbers
    const regNumDup = await Team.findOne({
      $or: [
        { 'leader.registerNumber': { $in: regNums } },
        { 'member2.registerNumber': { $in: regNums } },
        { 'member3.registerNumber': { $in: regNums } },
        { 'member4.registerNumber': { $in: regNums } }
      ]
    });
    if (regNumDup) {
      return res.status(400).json({ message: 'One or more member register numbers are already registered in another team!' });
    }

    // Generate unique Team ID atomically
    const counter = await Counter.findOneAndUpdate(
      { id: 'teamId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const paddedSeq = String(counter.seq).padStart(4, '0');
    const teamId = `RTIC${paddedSeq}`;

    // Screenshot path
    const screenshotPath = '/uploads/' + req.file.filename;

    const newTeam = new Team({
      teamId,
      teamName: teamName.trim(),
      college: college.trim(),
      department: department.trim(),
      leader,
      ...(member2 && member2.name ? { member2 } : {}),
      ...(member3 && member3.name ? { member3 } : {}),
      ...(member4 && member4.name ? { member4 } : {}),
      transactionId: transactionId.trim(),
      paymentScreenshot: screenshotPath,
      amount: activeMembers.length * 350
    });

    await newTeam.save();

    // Fire email asynchronously (won't block HTTP response)
    sendNotificationEmail(newTeam, 'received');

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      team: {
        teamId: newTeam.teamId,
        teamName: newTeam.teamName,
        leaderName: newTeam.leader.name,
        amount: newTeam.amount,
        status: newTeam.status,
        registrationDate: newTeam.registrationDate
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'An internal server error occurred during registration.' });
  }
};

// Admin endpoints (JWT Protected)

// Get all teams with filter and search
exports.getAllTeams = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { teamId: searchRegex },
        { teamName: searchRegex },
        { college: searchRegex },
        { department: searchRegex },
        { transactionId: searchRegex },
        { 'leader.name': searchRegex },
        { 'leader.registerNumber': searchRegex },
        { 'leader.email': searchRegex }
      ];
    }

    const teams = await Team.find(query).sort({ registrationDate: -1 });
    res.json(teams);
  } catch (error) {
    console.error('Fetch teams error:', error);
    res.status(500).json({ message: 'Failed to fetch teams' });
  }
};

// Get Dashboard Statistics
exports.getStats = async (req, res) => {
  try {
    const totalTeams = await Team.countDocuments();
    const approvedTeams = await Team.countDocuments({ status: 'approved' });
    const pendingTeams = await Team.countDocuments({ status: 'pending' });
    const rejectedTeams = await Team.countDocuments({ status: 'rejected' });

    // Amount collected = approved teams * 1400
    const amountCollected = approvedTeams * 1400;

    // Total participants = approved teams * 4
    const totalParticipants = approvedTeams * 4;

    res.json({
      totalTeams,
      totalParticipants,
      amountCollected,
      pendingTeams,
      approvedTeams,
      rejectedTeams
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard metrics' });
  }
};

// Update Team status (Approve / Reject)
exports.updateTeamStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value!' });
    }

    const team = await Team.findByIdAndUpdate(id, { status }, { new: true });
    if (!team) {
      return res.status(404).json({ message: 'Team not found!' });
    }

    // Trigger email notification for status change
    sendNotificationEmail(team, status);

    res.json({ success: true, message: `Registration status updated to ${status}!`, team });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ message: 'Failed to update registration status' });
  }
};

// Edit Team details (Admin custom correction)
exports.editTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { teamName, college, department, leader, member2, member3, member4, transactionId } = req.body;

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found!' });
    }

    // If changing unique fields, verify duplicates
    if (teamName && teamName.trim() !== team.teamName) {
      const dup = await Team.findOne({ teamName: teamName.trim(), _id: { $ne: id } });
      if (dup) return res.status(400).json({ message: 'Team Name is already taken!' });
      team.teamName = teamName.trim();
    }

    if (transactionId && transactionId.trim() !== team.transactionId) {
      const dup = await Team.findOne({ transactionId: transactionId.trim(), _id: { $ne: id } });
      if (dup) return res.status(400).json({ message: 'Transaction ID is already registered!' });
      team.transactionId = transactionId.trim();
    }

    if (college) team.college = college.trim();
    if (department) team.department = department.trim();
    if (leader) team.leader = { ...team.leader, ...leader };
    if (member2) team.member2 = { ...team.member2, ...member2 };
    if (member3) team.member3 = { ...team.member3, ...member3 };
    if (member4) team.member4 = { ...team.member4, ...member4 };

    await team.save();
    res.json({ success: true, message: 'Team registration details updated successfully!', team });
  } catch (error) {
    console.error('Edit team error:', error);
    res.status(500).json({ message: 'Failed to edit team details' });
  }
};

// Delete Team registration
exports.deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found!' });
    }

    // Remove screenshot file if it exists
    if (team.paymentScreenshot) {
      const filePath = path.join(__dirname, '..', team.paymentScreenshot);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Team.findByIdAndDelete(id);
    res.json({ success: true, message: 'Registration deleted successfully!' });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ message: 'Failed to delete team registration' });
  }
};
