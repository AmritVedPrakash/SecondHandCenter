// ─────────────────────────────────────────────────────────────────────────────
//  BazaarBuddy — Auth API
//  Routes: POST /api/auth/register | POST /api/auth/login | POST /api/auth/logout
// ─────────────────────────────────────────────────────────────────────────────

import api from './axios';

// ─────────────────────────────────────────────────────────────────────────────
//  REGISTER
//  POST /api/auth/register
//
//  Request body:
//    { name: string, email: string, phone: string (10-digit Indian), password: string (min 6) }
//
//  Success 201:
//    {
//      success: true,
//      message: "Registration successful!",
//      token: "jwt_token_string",
//      data: {
//        _id, name, email, phone, avatar, locationName,
//        isStudentVerified, rating: { average, count }, listingsCount
//      }
//    }
//
//  Errors:
//    400 — validation error (name/email/phone/password missing or invalid)
//    400 — "Email already registered." or "Phone number already registered."
// ─────────────────────────────────────────────────────────────────────────────
export const register = (body) =>
  api.post('/auth/register', body).then((r) => r.data);

// ─────────────────────────────────────────────────────────────────────────────
//  LOGIN
//  POST /api/auth/login
//
//  Request body:
//    { email: string, password: string }
//
//  Success 200:
//    {
//      success: true,
//      message: "Login successful!",
//      token: "jwt_token_string",
//      data: {
//        _id, name, email, phone, avatar, locationName,
//        isStudentVerified, isAdmin, rating: { average, count }, listingsCount
//      }
//    }
//
//  Errors:
//    400 — validation error
//    401 — "Invalid email or password."
// ─────────────────────────────────────────────────────────────────────────────
export const login = (body) =>
  api.post('/auth/login', body).then((r) => r.data);

// ─────────────────────────────────────────────────────────────────────────────
//  LOGOUT
//  POST /api/auth/logout  (requires Authorization header)
//
//  Success 200:
//    { success: true, message: "Logged out successfully." }
//
//  Note: Backend is stateless (JWT). This endpoint just acknowledges logout.
//        Frontend must also remove bb_token from localStorage.
// ─────────────────────────────────────────────────────────────────────────────
export const logout = () =>
  api.post('/auth/logout').then((r) => r.data);
