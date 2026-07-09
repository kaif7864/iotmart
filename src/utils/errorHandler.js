import toast from 'react-hot-toast';

/**
 * Centralized error handler for API requests and try-catch blocks.
 * @param {Error|any} error - The error object.
 * @param {string} [customMessage] - Optional custom message to display.
 */
export const handleError = (error, customMessage) => {
  console.error('[Error Details]:', error);

  let message = customMessage || 'An unexpected error occurred.';

  // Check if it's an Axios error with response data
  if (error.response && error.response.data) {
    message = error.response.data.detail || error.response.data.message || message;
  } else if (error.message) {
    message = error.message;
  }

  // Check if we are offline
  if (!navigator.onLine) {
    message = 'No internet connection. Please check your network.';
  }

  toast.error(message);
};
