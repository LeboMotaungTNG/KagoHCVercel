const jwt = require('jsonwebtoken');
const User = require('../../modules/users/models/User');

module.exports = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find the user
    const user = await User.findById(decoded.userId || decoded.id).select('-password');
    
    if (!user) {
      throw new Error();
    }
    
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      error: 'Please authenticate'
    });
  }
};
