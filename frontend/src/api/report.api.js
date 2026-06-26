// ─────────────────────────────────────────────────────────────────────────────
//  BazaarBuddy — Report API
//  Route: POST /api/reports
// ─────────────────────────────────────────────────────────────────────────────

import api from './axios';

// ─────────────────────────────────────────────────────────────────────────────
//  CREATE REPORT (Flag an item)
//  POST /api/reports   (requires auth)
//
//  Request body:
//    {
//      itemId: string,   // item being reported
//      reason: string    // max 500 chars (e.g. "Spam", "Misleading", "Offensive")
//    }
//
//  Success 201:
//    {
//      success: true,
//      message: "Report submitted. We will review it shortly.",
//      data: { _id, reporter, item, reason, status: "pending", createdAt }
//    }
//
//  Errors:
//    400 — "itemId and reason are required."
//    400 — "You have already reported this item."
//         (Unique index: one report per user per item)
//
//  Note: Admin-only routes (GET all reports, PATCH status) are not exposed
//        to the frontend — only the create route is used by regular users.
// ─────────────────────────────────────────────────────────────────────────────
export const createReport = ({ itemId, reason }) =>
  api.post('/reports', { itemId, reason }).then((r) => r.data);
