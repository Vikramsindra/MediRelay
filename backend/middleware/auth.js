const { verifyAccessToken } = require("../services/jwtService");

function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }

    req.user = decoded;
    return next();
}

function requireRole(allowedRoles = []) {
    return function checkRole(req, res, next) {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: "Forbidden" });
        }

        return next();
    };
}

function requireStaff(req, res, next) {
    return requireAuth(req, res, () => {
        if (req.user?.userType !== "staff") {
            return res.status(403).json({ success: false, message: "Staff access only" });
        }
        return next();
    });
}

function requirePatient(req, res, next) {
    return requireAuth(req, res, () => {
        if (req.user?.userType !== "patient") {
            return res.status(403).json({ success: false, message: "Patient access only" });
        }
        return next();
    });
}

function requireDoctor(req, res, next) {
    return requireStaff(req, res, () => requireRole(["doctor"])(req, res, next));
}

module.exports = {
    requireAuth,
    requireRole,
    requireStaff,
    requirePatient,
    requireDoctor,
};
