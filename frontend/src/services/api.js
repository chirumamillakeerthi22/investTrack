import { supabase } from './supabase';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function authenticatedRequest(path, accessToken) {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Backend authentication failed: ${response.status}`
    );
  }

  return response.json();
}

export async function getAuthenticatedUser(accessToken) {
  return authenticatedRequest(
    '/api/auth/me',
    accessToken
  );
}

export async function getUserProfile(accessToken) {
  return authenticatedRequest(
    '/api/auth/profile',
    accessToken
  );
}