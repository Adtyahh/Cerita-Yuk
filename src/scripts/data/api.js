import CONFIG from '../config';
import { getAuthToken } from '../utils';

async function handleResponse(response) {
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Terjadi kesalahan');
  }
  return response.json();
}

export async function login({ email, password }) {
  const response = await fetch(`${CONFIG.BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(response);
}

export async function register({ name, email, password }) {
  const response = await fetch(`${CONFIG.BASE_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, password }),
  });
  return handleResponse(response);
}

export async function getAllStories() {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Anda harus login terlebih dahulu');
  }

  const response = await fetch(`${CONFIG.BASE_URL}/stories`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(response);
}

export async function addNewStory(formData) {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Anda harus login terlebih dahulu');
  }

  const response = await fetch(`${CONFIG.BASE_URL}/stories`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  return handleResponse(response);
}