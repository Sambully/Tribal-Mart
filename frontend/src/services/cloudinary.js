// Direct browser → Cloudinary uploads via an unsigned upload preset.
// We bypass the Node backend entirely for file storage so files end up on
// Cloudinary's CDN, accessible from any device (works around the
// "files only exist on the machine that did the upload" problem).

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const PRESET = import.meta.env.VITE_CLOUDINARY_PRESET;

export const isCloudinaryConfigured = () => Boolean(CLOUD_NAME && PRESET);

/**
 * Upload a single File / Blob to Cloudinary.
 * Returns the public CDN URL (secure_url).
 *
 * Uses the /auto/upload endpoint so images, PDFs, and other allowed
 * file types are all routed to the right resource_type automatically.
 */
export const uploadToCloudinary = async (file) => {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      'Cloudinary is not configured — set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_PRESET in frontend/.env'
    );
  }
  if (!file) throw new Error('uploadToCloudinary: no file provided');

  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', PRESET);

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

  const res = await fetch(url, { method: 'POST', body: fd });
  if (!res.ok) {
    let msg = `Cloudinary upload failed (HTTP ${res.status})`;
    try {
      const data = await res.json();
      if (data?.error?.message) msg = `Cloudinary: ${data.error.message}`;
    } catch (_) {
      /* response wasn't JSON */
    }
    throw new Error(msg);
  }
  const data = await res.json();
  return data.secure_url;
};

/**
 * Upload many files in parallel. Returns array of secure_urls
 * in the same order as the input files.
 */
export const uploadMultipleToCloudinary = async (files) => {
  return Promise.all(Array.from(files).map((f) => uploadToCloudinary(f)));
};

export default uploadToCloudinary;
