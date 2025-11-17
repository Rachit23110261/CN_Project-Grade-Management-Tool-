import crypto from 'crypto';

/**
 * Validates that required environment variables exist and are secure
 * @throws {Error} If validation fails
 */
export const validateEnvironment = () => {
  const requiredEnvVars = [
    'JWT_SECRET',
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD'
  ];

  // Check if all required env vars exist
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(
      `❌ Missing required environment variables: ${missingVars.join(', ')}\n` +
      `Please check your .env file and ensure all required variables are set.`
    );
  }

  // Validate JWT_SECRET strength
  validateJWTSecret(process.env.JWT_SECRET);

  console.log('✅ Environment variables validated successfully');
};

/**
 * Validates JWT secret strength
 * @param {string} secret - The JWT secret to validate
 * @throws {Error} If secret is weak
 */
const validateJWTSecret = (secret) => {
  const minLength = 32;
  
  if (!secret) {
    throw new Error(
      '❌ JWT_SECRET is not defined!\n' +
      'Please add JWT_SECRET to your .env file.\n' +
      `Example: JWT_SECRET=${crypto.randomBytes(32).toString('hex')}`
    );
  }

  if (secret.length < minLength) {
    throw new Error(
      `❌ JWT_SECRET is too short! (${secret.length} characters)\n` +
      `Minimum length: ${minLength} characters\n` +
      'For security, use a strong random secret.\n' +
      `Example: JWT_SECRET=${crypto.randomBytes(32).toString('hex')}`
    );
  }

  // Check for common weak secrets
  const weakSecrets = [
    'secret',
    'mysecret',
    'jwtsecret',
    'password',
    '123456',
    'your-secret-key',
    'your_jwt_secret',
    'change-me',
    'changeme'
  ];

  if (weakSecrets.includes(secret.toLowerCase())) {
    throw new Error(
      `❌ JWT_SECRET is too weak! Don't use common words.\n` +
      'Please generate a strong random secret.\n' +
      `Example: JWT_SECRET=${crypto.randomBytes(32).toString('hex')}`
    );
  }

  // Check complexity - should have both letters and numbers
  const hasLetters = /[a-zA-Z]/.test(secret);
  const hasNumbers = /[0-9]/.test(secret);
  
  if (!hasLetters || !hasNumbers) {
    console.warn(
      '⚠️  WARNING: JWT_SECRET should contain both letters and numbers for better security.\n' +
      `Consider using: JWT_SECRET=${crypto.randomBytes(32).toString('hex')}`
    );
  }

  console.log(`✅ JWT_SECRET is strong (${secret.length} characters)`);
};

/**
 * Generates a strong JWT secret
 * @returns {string} A cryptographically strong random secret
 */
export const generateJWTSecret = () => {
  return crypto.randomBytes(64).toString('hex');
};
