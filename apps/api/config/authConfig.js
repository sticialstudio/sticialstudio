const envSecret = process.env.JWT_SECRET;
const isProduction = process.env.NODE_ENV === 'production';
const DEV_FALLBACK_SECRET = 'edtech-local-dev-jwt-secret';

if (!envSecret && isProduction) {
    throw new Error('Missing required environment variable: JWT_SECRET');
}

if (!envSecret && !isProduction) {
    console.warn('[auth] JWT_SECRET is not set. Using local development fallback secret.');
}

const JWT_SECRET = envSecret || DEV_FALLBACK_SECRET;

module.exports = {
    JWT_SECRET
};
