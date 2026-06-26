const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { uploadItemPhotos } = require('../config/cloudinary');
const {
  createItem, getNearbyItems, getMyItems, getItemById,
  updateItem, deleteItem, markAsSold, addPhotos,
} = require('../controllers/item.controller');

router.post('/',    protect, uploadItemPhotos.array('photos', 4), createItem);
router.get('/',     getNearbyItems);
router.get('/my',   protect, getMyItems);
router.get('/:itemId', getItemById);
router.put('/:itemId',         protect, updateItem);
router.delete('/:itemId',      protect, deleteItem);
router.patch('/:itemId/sold',  protect, markAsSold);
router.post('/:itemId/photos', protect, uploadItemPhotos.array('photos', 4), addPhotos);

module.exports = router;
