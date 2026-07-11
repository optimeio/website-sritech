const express = require('express');
const { body } = require('express-validator');
const { protectAdmin } = require('../middleware/auth');
const categoryController = require('../controllers/categoryController');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.get('/', categoryController.getCategories);
router.post('/',
  protectAdmin,
  [
    body('name').notEmpty().withMessage('Category name is required'),
    body('slug').optional().isString()
  ],
  validateRequest,
  categoryController.createCategory
);
router.put('/:id',
  protectAdmin,
  [
    body('name').notEmpty().withMessage('Category name is required'),
    body('slug').optional().isString()
  ],
  validateRequest,
  categoryController.updateCategory
);
router.delete('/:id', protectAdmin, categoryController.deleteCategory);

module.exports = router;
