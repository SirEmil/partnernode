import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { db } from '../config/firebase';

const router = express.Router();

// Get all customers (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated'
      });
    }

    // Check if user has admin privileges (authLevel: 1)
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    if (userData.authLevel !== 1) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admin users can view customers'
      });
    }

    // Get all customers from Firestore
    const customersSnapshot = await db.collection('customers').get();
    
    const customers = customersSnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
      };
    });

    // Sort by creation date (newest first)
    customers.sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    res.json({
      success: true,
      customers,
      count: customers.length
    });

  } catch (error: any) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      error: 'Failed to fetch customers',
      message: error.message
    });
  }
});

// Get customer by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    const customerId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated'
      });
    }

    // Check if user has admin privileges
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || userData.authLevel !== 1) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admin users can view customer details'
      });
    }

    const customerDoc = await db.collection('customers').doc(customerId).get();
    
    if (!customerDoc.exists) {
      return res.status(404).json({
        error: 'Customer not found'
      });
    }

    const customerData = customerDoc.data();
    const customer = {
      id: customerDoc.id,
      ...customerData,
      createdAt: customerData?.createdAt?.toDate?.() || customerData?.createdAt,
      updatedAt: customerData?.updatedAt?.toDate?.() || customerData?.updatedAt
    };

    res.json({
      success: true,
      customer
    });

  } catch (error: any) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      error: 'Failed to fetch customer',
      message: error.message
    });
  }
});

export default router;
