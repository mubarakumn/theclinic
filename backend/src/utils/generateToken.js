import jwt from 'jsonwebtoken';

const generateToken = (userId, tenantId) => {
  return jwt.sign(
    { id: userId, tenantId }, 
    process.env.JWT_SECRET || 'fallback_secret', 
    { expiresIn: '30d' }
  );
};

export default generateToken;