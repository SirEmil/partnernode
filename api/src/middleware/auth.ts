import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';

interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('Auth middleware - Header:', authHeader);
  console.log('Auth middleware - Token:', token ? 'Present' : 'Missing');

  if (!token) {
    console.log('Auth middleware - No token provided');
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    console.log('Auth middleware - Token verified for user:', decodedToken.uid);
    req.user = { uid: decodedToken.uid, email: decodedToken.email! };
    next();
  } catch (error) {
    console.log('Auth middleware - Token verification failed:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};
