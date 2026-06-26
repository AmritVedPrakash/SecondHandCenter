const { cloudinary } = require('../config/cloudinary');

// Cloudinary moderation labels that we block
const BLOCKED_LABELS = [
  'explicit_nudity',
  'nudity',
  'graphic_male_nudity',
  'graphic_female_nudity',
  'sexual_activity',
  'partial_nudity',
  'suggestive',
  'revealing_clothes',
  'violence',
  'visually_disturbing',
  'graphic_violence',
  'corpses',
  'hanging',
  'air_crash',
  'explosions_and_blasts',
  'hate_symbols',
  'nazi_party',
  'white_supremacy',
];

// Map Cloudinary label names to our ContentFlag enum
const labelToFlagType = (labelName) => {
  const name = labelName.toLowerCase();
  if (['explicit_nudity', 'nudity', 'graphic_male_nudity', 'graphic_female_nudity',
       'sexual_activity'].includes(name)) return 'explicit';
  if (['suggestive', 'partial_nudity', 'revealing_clothes'].includes(name)) return 'suggestive';
  if (['violence', 'graphic_violence'].includes(name)) return 'violence';
  if (['visually_disturbing', 'corpses', 'hanging', 'air_crash',
       'explosions_and_blasts'].includes(name)) return 'gore';
  return 'other';
};

/**
 * moderatePhoto(publicId)
 *
 * Checks a Cloudinary image's moderation result.
 * The image must have been uploaded with moderation:'aws_rek' in cloudinary.js.
 *
 * Returns:
 *   { safe: true }                          — image is clean
 *   { safe: false, flagType, confidence }   — image violates policy
 */
const moderatePhoto = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId, {
      moderations: 'aws_rek',
    });

    const moderation = result.moderation;
    if (!moderation || moderation.length === 0) {
      // No moderation data yet (async) — treat as safe, flag manually if needed
      return { safe: true };
    }

    const awsMod = moderation.find((m) => m.kind === 'aws_rek') || moderation[0];

    if (awsMod.status === 'rejected') {
      // Find highest confidence blocked label
      const labels = awsMod.output || [];
      const badLabels = labels.filter((l) =>
        BLOCKED_LABELS.some((blocked) => l.name?.toLowerCase().includes(blocked))
      );

      const topLabel = badLabels.sort((a, b) => b.confidence - a.confidence)[0];

      return {
        safe:       false,
        flagType:   topLabel ? labelToFlagType(topLabel.name) : 'other',
        confidence: topLabel ? topLabel.confidence / 100 : 1.0, // Rekognition gives 0-100
      };
    }

    return { safe: true };
  } catch (err) {
    // If moderation API is unavailable or public_id is wrong — fail open
    // (don't block legitimate uploads due to API errors)
    console.error('[moderatePhoto] Error checking moderation:', err.message);
    return { safe: true };
  }
};

/**
 * extractPublicId(cloudinaryUrl)
 *
 * Extracts the Cloudinary public_id from a full URL.
 * Example:
 *   "https://res.cloudinary.com/mycloud/image/upload/v1234/bazaarbuddy/items/abc123.jpg"
 *   → "bazaarbuddy/items/abc123"
 */
const extractPublicId = (url) => {
  try {
    // Match everything after /upload/ (skip version v1234 if present) and before file extension
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

module.exports = { moderatePhoto, extractPublicId };