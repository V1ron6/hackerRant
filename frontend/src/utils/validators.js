/**
 * validators
 * Shared form validation helpers.
 */

export const isValidEmail = (email) => {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidUsername = (username) => {
  if (!username) return false;
  return /^[a-zA-Z0-9_]{3,30}$/.test(username);
};

export const isValidOtp = (otp) => {
  return /^[0-9]{6}$/.test(otp || '');
};
