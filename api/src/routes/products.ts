import express from 'express';
import Joi from 'joi';
import { db } from '../config/firebase';
import { authenticateToken } from '../middleware/auth';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email: string;
      };
    }
  }
}

const router = express.Router();

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  smsTemplate: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Validation schemas
const createProductSchema = Joi.object({
  name: Joi.string().required().max(100),
  description: Joi.string().optional().max(500),
  price: Joi.number().required().min(0),
  currency: Joi.string().required().length(3),
  smsTemplate: Joi.string().required().max(1600)
});

const updateProductSchema = Joi.object({
  name: Joi.string().optional().max(100),
  description: Joi.string().optional().max(500),
  price: Joi.number().optional().min(0),
  currency: Joi.string().optional().length(3),
  smsTemplate: Joi.string().optional().max(1600)
});

// Get all products
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    
    const snapshot = await db.collection('products')
      .where('createdBy', '==', userId)
      .get();

    const products: Product[] = [];
    snapshot.forEach(doc => {
      const data = doc.data() as Omit<Product, 'id'>;
      products.push({
        id: doc.id,
        ...data
      });
    });

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;

    const doc = await db.collection('products').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = doc.data() as Product;
    
    if (product.createdBy !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      data: {
        ...product,
        id: doc.id
      }
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create product
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { error, value } = createProductSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const userId = req.user?.uid;
    const productData: Omit<Product, 'id'> = {
      ...value,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId
    };

    const docRef = await db.collection('products').add(productData);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        id: docRef.id,
        ...productData
      }
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateProductSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const userId = req.user?.uid;

    // Check if product exists and belongs to user
    const doc = await db.collection('products').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = doc.data() as Product;
    if (product.createdBy !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update product
    const updateData = {
      ...value,
      updatedAt: new Date()
    };

    await db.collection('products').doc(id).update(updateData);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: {
        ...product,
        ...updateData,
        id
      }
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;

    // Check if product exists and belongs to user
    const doc = await db.collection('products').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = doc.data() as Product;
    if (product.createdBy !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db.collection('products').doc(id).delete();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
