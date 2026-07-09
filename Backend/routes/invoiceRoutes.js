const express = require('express');
const { protect } = require('../middleware/auth');
const invoiceController = require('../controllers/invoiceController');
const router = express.Router();

router.get('/', protect, invoiceController.getInvoices);
router.get('/:id', protect, invoiceController.getInvoiceById);
router.post('/', protect, invoiceController.createInvoiceForOrder);
router.patch('/:id', protect, invoiceController.updateInvoice);

module.exports = router;
