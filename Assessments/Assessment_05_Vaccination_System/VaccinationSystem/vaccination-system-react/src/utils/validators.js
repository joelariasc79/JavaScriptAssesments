// Form validation logic
// utils/validators.js
// A collection of utility functions for input validation.

/**
 * Checks if a string is empty or contains only whitespace.
 * @param {string} value The string to check.
 * @returns {boolean} True if the string is empty or blank, false otherwise.
 */
export const isEmpty = (value) => {
    return value === null || value === undefined || value.trim() === '';
};

/**
 * Validates an email address format.
 * @param {string} email The email string to validate.
 * @returns {boolean} True if the email format is valid, false otherwise.
 */
export const isValidEmail = (email) => {
    // Basic regex for email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validates a password based on minimum length.
 * @param {string} password The password string to validate.
 * @param {number} minLength The minimum required length.
 * @returns {boolean} True if the password meets the minimum length, false otherwise.
 */
export const isValidPassword = (password, minLength = 6) => {
    return password.length >= minLength;
};

/**
 * Checks if two strings match (e.g., for password confirmation).
 * @param {string} value1 The first string.
 * @param {string} value2 The second string.
 * @returns {boolean} True if the strings match, false otherwise.
 */
export const doStringsMatch = (value1, value2) => {
    return value1 === value2;
};

/**
 * Validates if a value is a positive number.
 * @param {*} value The value to check.
 * @returns {boolean} True if the value is a positive number, false otherwise.
 */
export const isPositiveNumber = (value) => {
    return typeof value === 'number' && value > 0;
};

/**
 * Validates if a string contains only alphabetic characters.
 * @param {string} value The string to check.
 * @returns {boolean} True if the string contains only letters, false otherwise.
 */
export const isAlphabetic = (value) => {
    const alphaRegex = /^[a-zA-Z]+$/;
    return alphaRegex.test(value);
};

/**
 * Validates if a string contains only alphanumeric characters.
 * @param {string} value The string to check.
 * @returns {boolean} True if the string contains only letters and numbers, false otherwise.
 */
export const isAlphanumeric = (value) => {
    const alphanumericRegex = /^[a-zA-Z0-9]+$/;
    return alphanumericRegex.test(value);
};

/**
 * Validates a date string against a specific format (e.g., YYYY-MM-DD) or checks if it's a valid date.
 * This is a basic check; for robust date validation, consider a library like `date-fns`.
 * @param {string} dateString The date string to validate.
 * @returns {boolean} True if the date string is valid, false otherwise.
 */
export const isValidDate = (dateString) => {
    // Basic check for YYYY-MM-DD format and if it's a parseable date
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && date.toISOString().slice(0,10) === dateString;
};
