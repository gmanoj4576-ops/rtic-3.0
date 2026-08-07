const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const envUsername = process.env.ADMIN_USERNAME || 'admin';
    const envPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (username !== envUsername) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if password matches (supports pre-hashed or plain text env password)
    let isMatch = false;
    const isHashed = envPassword.startsWith('$2a$') || envPassword.startsWith('$2b$') || envPassword.startsWith('$2y$');
    
    if (isHashed) {
      isMatch = await bcrypt.compare(password, envPassword);
    } else {
      isMatch = (password === envPassword);
    }
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Sign JWT Token
    const payload = {
      admin: {
        username: envUsername
      }
    };
    
    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'fallback_secret_rtic_2026',
      { expiresIn: '8h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, username: envUsername });
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
