const jwt = require("jsonwebtoken");

const secret = () => process.env.JWT_SECRET || "dev-secret-change-me";

const sign = (address, role) => jwt.sign({ address: address.toLowerCase(), role }, secret(), { expiresIn: "8h" });

function requireAuth(...roles) {
  return (req, res, next) => {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      req.user = jwt.verify(token, secret());
    } catch {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden for role " + req.user.role });
    }
    next();
  };
}

module.exports = { sign, requireAuth };
