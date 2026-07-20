/**
 * 4 Letter and Under Username Checker
 * Checks if a username is valid and available (4 characters or less)
 */

const fetch = require('node-fetch');

// Username validation rules
const RULES = {
  maxLength: 4,
  minLength: 1,
  validChars: /^[a-z0-9-]+$/i,
  noConsecutiveDashes: /--/,
  noStartOrEndDash: /^-|-$/,
};

/**
 * Validates username format
 * @param {string} username - The username to validate
 * @returns {object} - Validation result with status and message
 */
function validateFormat(username) {
  if (!username || typeof username !== 'string') {
    return { valid: false, message: 'Username must be a non-empty string' };
  }

  const trimmed = username.trim();

  if (trimmed.length > RULES.maxLength) {
    return { valid: false, message: `Username must be ${RULES.maxLength} characters or less` };
  }

  if (trimmed.length < RULES.minLength) {
    return { valid: false, message: `Username must be at least ${RULES.minLength} character` };
  }

  if (!RULES.validChars.test(trimmed)) {
    return { valid: false, message: 'Username can only contain letters, numbers, and hyphens' };
  }

  if (RULES.noConsecutiveDashes.test(trimmed)) {
    return { valid: false, message: 'Username cannot contain consecutive dashes' };
  }

  if (RULES.noStartOrEndDash.test(trimmed)) {
    return { valid: false, message: 'Username cannot start or end with a dash' };
  }

  return { valid: true, message: 'Format is valid' };
}

/**
 * Checks if username is available on GitHub
 * @param {string} username - The username to check
 * @returns {Promise<object>} - Availability result
 */
async function checkGitHubAvailability(username) {
  try {
    const response = await fetch(`https://api.github.com/users/${username}`);
    
    if (response.status === 404) {
      return { available: true, message: 'Username is available on GitHub' };
    } else if (response.status === 200) {
      return { available: false, message: 'Username is taken on GitHub' };
    } else {
      return { available: null, message: 'Could not check GitHub availability' };
    }
  } catch (error) {
    return { available: null, message: `Error checking GitHub: ${error.message}` };
  }
}

/**
 * Complete username checker
 * @param {string} username - The username to check
 * @param {boolean} checkGitHub - Whether to check GitHub availability (default: true)
 * @returns {Promise<object>} - Complete check result
 */
async function checkUsername(username, checkGitHub = true) {
  const formatCheck = validateFormat(username);

  const result = {
    username: username?.trim() || '',
    formatValid: formatCheck.valid,
    formatMessage: formatCheck.message,
    githubAvailable: null,
    githubMessage: null,
  };

  if (formatCheck.valid && checkGitHub) {
    const gitHubCheck = await checkGitHubAvailability(username.trim());
    result.githubAvailable = gitHubCheck.available;
    result.githubMessage = gitHubCheck.message;
  }

  return result;
}

module.exports = {
  validateFormat,
  checkGitHubAvailability,
  checkUsername,
  RULES,
};
