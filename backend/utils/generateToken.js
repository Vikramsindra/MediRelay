const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      hospital: user.hospital
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

module.exports = generateToken;