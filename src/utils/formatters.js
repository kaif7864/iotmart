/**
 * Format a date string to a localized date.
 * @param {string|Date} date - The date to format.
 * @param {string} [locale='en-IN'] - The locale to use.
 * @returns {string} The formatted date.
 */
export const formatDate = (date, locale = 'en-IN') => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format a date string to a localized date and time.
 * @param {string|Date} date - The date to format.
 * @param {string} [locale='en-IN'] - The locale to use.
 * @returns {string} The formatted date and time.
 */
export const formatDateTime = (date, locale = 'en-IN') => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Capitalize the first letter of a string.
 * @param {string} str - The string to capitalize.
 * @returns {string}
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Truncate a string to a specific length and add an ellipsis.
 * @param {string} str - The string to truncate.
 * @param {number} length - The maximum length.
 * @returns {string}
 */
export const truncateText = (str, length = 50) => {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
};
