/**
 * Application API configuration.
 * Uses VITE_API_URL if defined (for separate backend deployment on Render/Railway),
 * otherwise defaults to relative '/api' for same-origin or reverse-proxy setups.
 */
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
