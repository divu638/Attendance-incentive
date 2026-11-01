const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "contract.json");
if (!fs.existsSync(file)) {
  console.error("contract.json not found. Run `npm run deploy:local` in the project root first.");
  process.exit(1);
}
const { address, abi } = JSON.parse(fs.readFileSync(file, "utf8"));
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "http://127.0.0.1:8545");
const contract = new ethers.Contract(address, abi, provider);

/** Role is read from the contract, never trusted from the client. */
async function getRole(addr) {
  if ((await contract.admin()).toLowerCase() === addr.toLowerCase()) return "admin";
  if (await contract.isTeacher(addr)) return "teacher";
  if (await contract.isStudent(addr)) return "student";
  return "none";
}

module.exports = { ethers, provider, contract, getRole, address };
