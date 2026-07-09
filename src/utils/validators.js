/**
 * Validate an email address format.
 * @param {string} email 
 * @returns {boolean} True if valid, false otherwise.
 */
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Validate a password (at least 8 chars, 1 letter, 1 number).
 * @param {string} password 
 * @returns {boolean} True if valid, false otherwise.
 */
export const isValidPassword = (password) => {
  const re = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  return re.test(password);
};

/**
 * Validate phone number format (basic).
 * @param {string} phone 
 * @returns {boolean} True if valid, false otherwise.
 */
export const isValidPhone = (phone) => {
  const re = /^\+?[\d\s-]{10,}$/;
  return re.test(phone);
};

/**
 * Check if a string is empty or contains only whitespace.
 * @param {string} str 
 * @returns {boolean} True if empty, false otherwise.
 */
export const isEmpty = (str) => {
  return !str || str.trim().length === 0;
};
