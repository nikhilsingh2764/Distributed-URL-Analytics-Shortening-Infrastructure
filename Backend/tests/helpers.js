// Minimal env so modules that import config/env.js can load in unit tests.
process.env.NODE_ENV = "test";
process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret-test-access-secret";
process.env.JWT_REFRESH_SECRET ||= "test-refresh-secret-test-refresh-secret";
