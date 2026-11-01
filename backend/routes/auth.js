const router = require("express").Router();
const crypto = require("crypto");
const { ethers, getRole } = require("../chain");
const { sign } = require("../middleware/auth");
const db = require("../db");

const nonces = new Map(); // address -> { nonce, expires }
const message = (nonce) => `Sign in to Attendance-Linked Incentive Program.\nNonce: ${nonce}`;

// GET /api/auth/nonce?address=0x...
router.get("/nonce", (req, res) => {
  const { address } = req.query;
  if (!ethers.isAddress(address || "")) return res.status(400).json({ error: "Valid address required" });
  const nonce = crypto.randomBytes(16).toString("hex");
  nonces.set(address.toLowerCase(), { nonce, expires: Date.now() + 5 * 60 * 1000 });
  res.json({ message: message(nonce) });
});

// POST /api/auth/verify { address, signature } (MetaMask EIP-191 Auth)
router.post("/verify", async (req, res) => {
  try {
    const { address, signature } = req.body || {};
    if (!ethers.isAddress(address || "") || !signature) return res.status(400).json({ error: "address and signature required" });
    const key = address.toLowerCase();
    const entry = nonces.get(key);
    if (!entry || entry.expires < Date.now()) return res.status(401).json({ error: "Nonce expired. Request a new one." });

    const recovered = ethers.verifyMessage(message(entry.nonce), signature);
    if (recovered.toLowerCase() !== key) return res.status(401).json({ error: "Invalid signature" });
    nonces.delete(key); // one-time use

    const role = await getRole(address);
    await db.users.upsertRole(key, role);
    res.json({ token: sign(address, role), role, address: key });
  } catch (e) {
    res.status(401).json({ error: "Invalid signature" });
  }
});

// POST /api/auth/login { identifier, password }
// Unified login for ANY student (using Roll Number or Email), plus Teacher & Admin!
router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body || {};
    if (!identifier || !password) {
      return res.status(400).json({ error: "Please enter your Roll Number / Email and Password" });
    }

    const cleanId = String(identifier).trim().toLowerCase();
    let user = await db.users.findByIdentifier(cleanId);

    // Fallback aliases for quick testing
    if (!user) {
      if (cleanId === "admin" || cleanId === "admin@attendify.edu") {
        user = {
          walletAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
          name: "University Administrator",
          role: "admin",
          password: "admin@123",
          privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
        };
      } else if (cleanId === "teacher" || cleanId === "teacher@attendify.edu" || cleanId === "sarabjit.kaur@college.edu" || cleanId === "sarabjit") {
        user = {
          walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          name: "Ms. Sarabjit Kaur",
          designation: "Assistant Professor",
          department: "Department of Engineering Block",
          email: "sarabjit.kaur@college.edu",
          role: "teacher",
          password: "teacher@123",
          privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
        };
      }
    }

    if (!user) {
      return res.status(404).json({
        error: `No registered account found for "${identifier}". Please check your Roll Number or Email.`,
      });
    }

    // Accepted password variants:
    // 1. Their stored custom password
    // 2. Default "student@123" / "admin@123" / "teacher@123"
    // 3. Or their Roll Number itself (e.g. "2329313")
    const validPasswords = [
      user.password,
      "student@123",
      "admin@123",
      "teacher@123",
      (user.rollNo || "").toLowerCase(),
    ].filter(Boolean);

    const isMatch = validPasswords.includes(String(password).trim());
    if (!isMatch) {
      return res.status(401).json({
        error: "Incorrect password. Default password is 'student@123' or your Roll Number.",
      });
    }

    const token = sign(user.walletAddress, user.role);
    res.json({
      token,
      role: user.role,
      address: user.walletAddress,
      privateKey: user.privateKey,
      user: {
        name: user.name,
        rollNo: user.rollNo,
        email: user.email,
        department: user.department,
        semester: user.semester,
        walletAddress: user.walletAddress,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
