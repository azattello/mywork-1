/**
 * Normalize image URI - converts various image references to valid URIs
 * Handles: http/https URLs, data URIs, /uploads/ paths, and file:// paths
 * 
 * @param {string} value - Image URL/path to normalize
 * @param {string} baseUrl - Base API URL for /uploads/ paths (default: http://172.20.10.2:4000)
 * @returns {string|null} - Normalized URI or null if invalid
 */
export const getImageUri = (value, baseUrl = 'http://172.20.10.2:4000') => {
  if (!value || typeof value !== 'string') return null;
  
  // Already a full URL
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  
  // Data URI (for inline images)
  if (value.startsWith('data:')) return value;
  
  // Relative path starting with /uploads/ - add base URL
  if (value.startsWith('/uploads/')) return `${baseUrl}${value}`;
  
  // File URI (for mobile device photos)
  if (value.startsWith('file://')) return value;
  
  // Plain string without protocol - assume it's already a valid source
  return value || null;
};

/**
 * Get multiple image URIs - normalizes an array of image references
 * 
 * @param {array} images - Array of image URLs/paths
 * @param {string} baseUrl - Base API URL for /uploads/ paths
 * @returns {array} - Array of normalized URIs, with null values removed
 */
export const getImageUris = (images, baseUrl = 'http://172.20.10.2:4000') => {
  if (!Array.isArray(images)) return [];
  return images
    .map(img => getImageUri(img, baseUrl))
    .filter(uri => uri !== null);
};

/**
 * Get avatar URI - tries multiple field names in preference order
 * 
 * @param {object} user - User object with potential avatar fields
 * @param {string} baseUrl - Base API URL for /uploads/ paths
 * @returns {string|null} - Avatar URI or null if not found
 */
export const getAvatarUri = (user, baseUrl = 'http://172.20.10.2:4000') => {
  if (!user || typeof user !== 'object') return null;
  
  // Try different field names in order of preference
  const possibleFields = ['avatarUrl', 'avatar', 'photo', 'photoUrl', 'profileImage'];
  
  for (const field of possibleFields) {
    const value = user[field];
    const uri = getImageUri(value, baseUrl);
    if (uri) return uri;
  }
  
  return null;
};

/**
 * Get first valid portfolio image URI
 * 
 * @param {object} user - User object with portfolio field
 * @param {string} baseUrl - Base API URL
 * @returns {string|null} - First portfolio image URI or null
 */
export const getPortfolioImageUri = (user, baseUrl = 'http://172.20.10.2:4000') => {
  if (!user || !Array.isArray(user.portfolio)) return null;
  
  for (const url of user.portfolio) {
    const uri = getImageUri(url, baseUrl);
    if (uri) return uri;
  }
  
  return null;
};

export default getImageUri;
