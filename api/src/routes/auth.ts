import express from 'express';
import Joi from 'joi';
import { auth, db } from '../config/firebase';

const router = express.Router();

interface User {
  uid: string;
  email: string;
  displayName?: string;
  authLevel: number;
  createdAt: Date;
  updatedAt: Date;
}

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
  displayName: Joi.string().optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    console.log('Registration request received:', { email: req.body.email, displayName: req.body.displayName });
    
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      console.log('Validation error:', error.details[0].message);
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password, displayName } = value;
    console.log('Creating Firebase user for:', email);

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: displayName || undefined,
    });

    console.log('Firebase user created:', userRecord.uid);

    // Create user document in Firestore
    const userData: any = {
      uid: userRecord.uid,
      email: userRecord.email!,
      authLevel: 0, // Default to no settings access
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Only add displayName if it exists
    if (userRecord.displayName) {
      userData.displayName = userRecord.displayName;
    }

    console.log('Saving user data to Firestore...');
    await db.collection('users').doc(userRecord.uid).set(userData);
    console.log('User data saved to Firestore');

    // Generate custom token for client
    console.log('Generating custom token...');
    const customToken = await auth.createCustomToken(userRecord.uid);
    console.log('Custom token generated successfully');

    res.status(201).json({
      message: 'User registered successfully',
      token: customToken,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        authLevel: userData.authLevel,
        createdAt: userData.createdAt
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password } = value;

    // Sign in with Firebase Auth
    const userRecord = await auth.getUserByEmail(email);
    
    // Generate custom token for client
    const customToken = await auth.createCustomToken(userRecord.uid);

    // Get user data from Firestore and update last login
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    const userData = userDoc.data() as User;

    // Update last login time
    await db.collection('users').doc(userRecord.uid).update({
      lastLoginAt: new Date(),
      updatedAt: new Date()
    });

    res.json({
      message: 'Login successful',
      token: customToken,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        authLevel: userData?.authLevel,
        createdAt: userData?.createdAt
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    
    if (error.code === 'auth/user-not-found') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user endpoint
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify Firebase token
    const decodedToken = await auth.verifyIdToken(token);
    
    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data() as User;

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        authLevel: userData.authLevel,
        createdAt: userData.createdAt
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
