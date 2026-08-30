const Review = require('../models/Review');
const Order = require('../models/Order');
const ActivityLog = require('../models/ActivityLog');
const asyncHandler = require('../middleware/asyncHandler');

exports.getReviewsForProduct = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ productId: req.params.productId }).sort({ createdAt: -1 });
  res.json(reviews);
});

exports.createReview = asyncHandler(async (req, res) => {
  const { customerName, customerEmail, rating, comment } = req.body;
  const productId = req.params.productId;

  const query = {};
  if (customerEmail) {
    query.customerEmail = customerEmail;
  } else {
    query.customerName = customerName;
  }

  const orders = await Order.find(query);
  const hasPurchased = orders.some(order =>
    order.items.some(item => item.product && item.product.toString() === productId)
  );

  if (!hasPurchased) {
    return res.status(403).json({ message: 'Only customers who have purchased this product can leave a review.' });
  }

  const review = new Review({ productId, customerName, rating, comment });
  const savedReview = await review.save();
  await new ActivityLog({ action: 'Review Added', details: `Review by ${customerName} for product ${productId}` }).save();
  res.status(201).json(savedReview);
});

exports.deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.reviewId);
  if (!review) return res.status(404).json({ message: 'Review not found.' });
  await new ActivityLog({ action: 'Deleted Review', details: `Review ${req.params.reviewId} deleted` }).save();
  res.json({ message: 'Review deleted successfully.' });
});
