/**
 * Application API configuration.
 * Uses VITE_API_URL if defined, otherwise defaults directly to the live Render backend:
 * https://merge-mind.onrender.com
 */
export const API_BASE = (import.meta.env.VITE_API_URL || 'https://merge-mind.onrender.com').replace(/\/$/, '');

