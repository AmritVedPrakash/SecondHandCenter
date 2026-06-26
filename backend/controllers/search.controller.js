const Item = require('../models/Item');

// @route   GET /api/search?q=&lat=&lng=&radius=&category=&minPrice=&maxPrice=&page=&limit=
// @access  Public
const searchItems = async (req, res, next) => {
  try {
    const {
      q,
      lat,
      lng,
      radius   = 5,
      category,
      minPrice,
      maxPrice,
      page     = 1,
      limit    = 20,
    } = req.query;

    const latitude  = parseFloat(lat)    || 0;
    const longitude = parseFloat(lng)    || 0;
    const radiusKm  = parseFloat(radius) || 5;
    const pageNum   = parseInt(page)     || 1;
    const limitNum  = parseInt(limit)    || 20;
    const skip      = (pageNum - 1) * limitNum;

    // ─── Build match filter ───────────────────────────────
    const matchFilter = {
      status:   'active',
      isHidden: false,   // ← NEW: exclude hidden/moderated items
    };
    if (category) matchFilter.category = category;
    if (minPrice !== undefined || maxPrice !== undefined) {
      matchFilter.price = {};
      if (minPrice !== undefined) matchFilter.price.$gte = parseFloat(minPrice);
      if (maxPrice !== undefined) matchFilter.price.$lte = parseFloat(maxPrice);
    }

    const pipeline = [];

    // Stage 1: Geo filter (must come first)
    pipeline.push({
      $geoNear: {
        near:          { type: 'Point', coordinates: [longitude, latitude] },
        distanceField: 'distance',
        maxDistance:   radiusKm * 1000,
        query:         matchFilter,
        spherical:     true,
      },
    });

    // Stage 2: Text search filter
    if (q && q.trim()) {
      pipeline.push({
        $match: {
          $or: [
            { title:       { $regex: q.trim(), $options: 'i' } },
            { description: { $regex: q.trim(), $options: 'i' } },
          ],
        },
      });
    }

    // Count total before pagination
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult   = await Item.aggregate(countPipeline);
    const total         = countResult[0]?.total || 0;

    // Stage 3: Sort, paginate, populate owner
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limitNum },
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
      }
    );

    const items = await Item.aggregate(pipeline);

    res.json({
      success: true,
      data:    items,
      pagination: {
        page:  pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
      filters: { q, category, minPrice, maxPrice, radiusKm },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { searchItems };
