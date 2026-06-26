const Item        = require('../models/Item');
const User        = require('../models/User');
const ContentFlag = require('../models/ContentFlag');
const { moderatePhoto, extractPublicId } = require('../utils/moderatePhoto');

// @route   POST /api/items
// @access  Private
const createItem = async (req, res, next) => {
  try {
    const { title, description, price, category, locationName } = req.body;

    if (!title || !description || price === undefined || !category) {
      return res.status(400).json({ success: false, message: 'title, description, price, and category are required.' });
    }

    const photos = req.files ? req.files.map((f) => f.path) : [];

    const owner = await User.findById(req.user._id);
    let coordinates = owner.location.coordinates;
    if (req.body.lat && req.body.lng) {
      coordinates = [parseFloat(req.body.lng), parseFloat(req.body.lat)];
    }

    const item = await Item.create({
      title,
      description,
      price:        parseFloat(price),
      category,
      photos,
      owner:        req.user._id,
      location:     { type: 'Point', coordinates },
      locationName: locationName || owner.locationName || '',
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { listingsCount: 1 } });

    // ─── Content Moderation ───────────────────────────────
    if (photos.length > 0) {
      for (let i = 0; i < photos.length; i++) {
        const publicId = extractPublicId(photos[i]);
        if (!publicId) continue;

        const { safe, flagType, confidence } = await moderatePhoto(publicId);

        if (!safe) {
          await ContentFlag.create({
            item:             item._id,
            owner:            req.user._id,
            photoUrl:         photos[i],
            photoIndex:       i,
            flagType:         flagType || 'other',
            confidence:       confidence || 1.0,
            moderationSource: 'cloudinary',
            status:           'pending',
          });

          await Item.findByIdAndUpdate(item._id, {
            moderationStatus: 'flagged',
            isHidden:         true,
          });

          // Undo listingsCount since item is hidden
          await User.findByIdAndUpdate(req.user._id, { $inc: { listingsCount: -1 } });

          return res.status(201).json({
            success: false,
            message: 'Your listing is under review and will be visible once approved.',
            data:    null,
          });
        }
      }
    }
    // ─── End Moderation ───────────────────────────────────

    await item.populate('owner', 'name avatar rating isStudentVerified');

    res.status(201).json({ success: true, message: 'Item listed successfully!', data: item });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/items?lat=&lng=&radius=&page=&limit=
// @access  Public
//
// ── FALLBACK LOGIC ────────────────────────────────────────────────────────────
// Problem: if a user (e.g. a recruiter viewing the live demo link) is in a
// location where nobody has posted items, the feed would be completely empty
// and the project would look broken.
//
// Fix — 3-step fallback:
//   1. Try the user's chosen radius (e.g. 5km)
//   2. If nothing found, progressively widen the radius (50km -> 200km -> 1000km)
//   3. If still nothing (or no location at all), show ALL active items
//      platform-wide with no geo filter — the feed is NEVER empty.
//
// Response includes `meta.fallback` so the frontend can show a small banner
// like "No items nearby — showing all available items" when this kicks in.
const getNearbyItems = async (req, res, next) => {
  try {
    const lat    = parseFloat(req.query.lat)    || 0;
    const lng    = parseFloat(req.query.lng)    || 0;
    const radius = parseFloat(req.query.radius) || 5;   // km, user's chosen radius
    const page   = parseInt(req.query.page)     || 1;
    const limit  = parseInt(req.query.limit)    || 20;
    const skip   = (page - 1) * limit;

    const category = req.query.category;
    const minPrice = req.query.minPrice !== undefined ? parseFloat(req.query.minPrice) : undefined;
    const maxPrice = req.query.maxPrice !== undefined ? parseFloat(req.query.maxPrice) : undefined;

    const baseQuery = { status: 'active', isHidden: false };
    if (category && category !== 'All') {
      baseQuery.category = category;
    }
    if (Number.isFinite(minPrice)) {
      baseQuery.price = { $gte: minPrice };
    }
    if (Number.isFinite(maxPrice)) {
      baseQuery.price = {
        ...(baseQuery.price || {}),
        $lte: maxPrice,
      };
    }

    // Helper: run a geoNear query at a given radius (in km)
    const runGeoQuery = async (radiusKm) => {
      return Item.aggregate([
        {
          $geoNear: {
            near:          { type: 'Point', coordinates: [lng, lat] },
            distanceField: 'distance',
            maxDistance:   radiusKm * 1000,
            query:         baseQuery,
            spherical:     true,
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from:        'users',
            localField:  'owner',
            foreignField: '_id',
            as:          'owner',
            pipeline:    [{ $project: { name: 1, avatar: 1, rating: 1, isStudentVerified: 1 } }],
          },
        },
        { $unwind: '$owner' },
        {
          $addFields: {
            distanceKm: { $round: [{ $divide: ['$distance', 1000] }, 1] },
          },
        },
      ]);
    };

    let items      = [];
    let fallback   = null; // null | 'wider_radius' | 'all_items'
    let usedRadius = radius;

    // Step 1: Try user's chosen radius (only if lat/lng provided)
    if (lat && lng) {
      items = await runGeoQuery(radius);
    }

    // Step 2: No items? Try progressively wider radii
    if (items.length === 0 && lat && lng) {
      const widerRadii = [50, 200, 1000]; // km — covers city, state, country
      for (const r of widerRadii) {
        items = await runGeoQuery(r);
        if (items.length > 0) {
          fallback   = 'wider_radius';
          usedRadius = r;
          break;
        }
      }
    }

    // Step 3: Still nothing (or no location at all)? Show ALL items.
    if (items.length === 0) {
      items = await Item.aggregate([
        { $match: baseQuery },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from:        'users',
            localField:  'owner',
            foreignField: '_id',
            as:          'owner',
            pipeline:    [{ $project: { name: 1, avatar: 1, rating: 1, isStudentVerified: 1 } }],
          },
        },
        { $unwind: '$owner' },
      ]);
      fallback   = 'all_items';
      usedRadius = null;
    }

    res.json({
      success: true,
      data:    items,
      count:   items.length,
      meta: {
        fallback,            // null | 'wider_radius' | 'all_items'
        requestedRadius: radius,
        usedRadius,          // the radius that actually returned results
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/items/my
// @access  Private
const getMyItems = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    const items = await Item.find({ owner: req.user._id, status: { $ne: 'deleted' } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Item.countDocuments({ owner: req.user._id, status: { $ne: 'deleted' } });

    res.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/items/:itemId
// @access  Public
const getItemById = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.itemId).populate(
      'owner',
      'name avatar phone rating isStudentVerified locationName'
    );

    if (!item || item.status === 'deleted') {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    // Hidden items are only visible to their owner
    if (item.isHidden) {
      const requesterId = req.user?._id?.toString();
      const ownerId     = item.owner._id ? item.owner._id.toString() : item.owner.toString();
      if (requesterId !== ownerId) {
        return res.status(404).json({ success: false, message: 'Item not found.' });
      }
    }

    await Item.findByIdAndUpdate(req.params.itemId, { $inc: { views: 1 } });

    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/items/:itemId
// @access  Private (owner only)
const updateItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.itemId);

    if (!item || item.status === 'deleted') {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    if (item.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this item.' });
    }

    const { title, description, price, category, locationName } = req.body;

    if (title)               item.title       = title;
    if (description)         item.description = description;
    if (price !== undefined) { item.price = parseFloat(price); item.isFree = parseFloat(price) === 0; }
    if (category)            item.category    = category;
    if (locationName)        item.locationName = locationName;

    await item.save();

    res.json({ success: true, message: 'Item updated.', data: item });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/items/:itemId
// @access  Private (owner only)
const deleteItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.itemId);

    if (!item || item.status === 'deleted') {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    if (item.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this item.' });
    }

    item.status = 'deleted';
    await item.save();

    await User.findByIdAndUpdate(req.user._id, { $inc: { listingsCount: -1 } });

    res.json({ success: true, message: 'Item deleted.' });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/items/:itemId/sold
// @access  Private (owner only)
const markAsSold = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.itemId);

    if (!item || item.status === 'deleted') {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    if (item.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    item.isSold = true;
    item.status = 'sold';
    await item.save();

    res.json({ success: true, message: 'Item marked as sold! 🎉', data: item });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/items/:itemId/photos
// @access  Private (owner only)
const addPhotos = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.itemId);

    if (!item || item.status === 'deleted') {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    if (item.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Please upload at least one photo.' });
    }

    const newPhotos   = req.files.map((f) => f.path);
    const totalPhotos = [...item.photos, ...newPhotos];

    if (totalPhotos.length > 4) {
      return res.status(400).json({ success: false, message: `Max 4 photos allowed. You already have ${item.photos.length}.` });
    }

    // ─── Moderate new photos ──────────────────────────────
    for (let i = 0; i < newPhotos.length; i++) {
      const publicId = extractPublicId(newPhotos[i]);
      if (!publicId) continue;

      const { safe, flagType, confidence } = await moderatePhoto(publicId);

      if (!safe) {
        await ContentFlag.create({
          item:             item._id,
          owner:            req.user._id,
          photoUrl:         newPhotos[i],
          photoIndex:       item.photos.length + i,
          flagType:         flagType || 'other',
          confidence:       confidence || 1.0,
          moderationSource: 'cloudinary',
          status:           'pending',
        });

        await Item.findByIdAndUpdate(item._id, {
          moderationStatus: 'flagged',
          isHidden:         true,
        });

        return res.status(400).json({
          success: false,
          message: 'One of the uploaded photos violated our content policy. Your listing is under review.',
        });
      }
    }
    // ─── End moderation ───────────────────────────────────

    item.photos = totalPhotos;
    await item.save();

    res.json({ success: true, message: 'Photos added.', data: { photos: item.photos } });
  } catch (error) {
    next(error);
  }
};

module.exports = { createItem, getNearbyItems, getMyItems, getItemById, updateItem, deleteItem, markAsSold, addPhotos };