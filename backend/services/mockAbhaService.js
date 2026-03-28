// services/mockAbhaService.js
// Re-exports the mock implementation from utils/abhaService
// (keeps the mock logic in one place, satisfies the require() in authRoutes/controller)
module.exports = require("../utils/abhaService");
