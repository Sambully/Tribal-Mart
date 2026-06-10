import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper: convert any stored image/doc value into a loadable URL.
// Handles: full http(s) URLs, data URIs, absolute /uploads paths,
// and bare filenames (routed to the correct subfolder by prefix).
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;

  // Already loadable: full URL or data URI — return as-is.
  if (
    imagePath.startsWith('http://') ||
    imagePath.startsWith('https://') ||
    imagePath.startsWith('data:')
  ) {
    return imagePath;
  }

  // Absolute server path like "/uploads/documents/foo.pdf"
  if (imagePath.startsWith('/')) {
    return `${API_BASE_URL}${imagePath}`;
  }

  // Bare filename — detect which subfolder it belongs to by prefix.
  // KYC documents:
  if (/^(businessLicense|taxCertificate|authorizationLetter)-/i.test(imagePath)) {
    return `${API_BASE_URL}/uploads/documents/${imagePath}`;
  }
  // Avatars:
  if (/^avatar-/i.test(imagePath)) {
    return `${API_BASE_URL}/uploads/avatars/${imagePath}`;
  }
  // Default: product image (product-xxx.jpg, etc.)
  return `${API_BASE_URL}/uploads/products/${imagePath}`;
};

export default api;
