import { BrowserProvider, JsonRpcProvider, Wallet, Contract, isAddress } from "ethers";
import deployment from "./contract.json";

export { isAddress };
export const CONTRACT_ADDRESS = deployment.address;

// Pre-funded test accounts for Attendify Class Batch Demo
export const DEMO_ACCOUNTS = [
  {
    role: "admin",
    roleName: "Admin",
    title: "👑 Admin (University Head)",
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    description: "Contract owner & pool funder",
  },
  {
    role: "teacher",
    roleName: "Teacher",
    title: "👨‍🏫 Ms. Sarabjit Kaur (Assistant Professor)",
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    description: "Assistant Professor • Dept. of Engineering Block",
  },
  {
    role: "student",
    roleName: "Student",
    title: "🎒 DAISY CHAWLA (2329313)",
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    privateKey: "0x5de4111afa1a4b94908f83103eb272296907264315ca30471297d0ce85f17e01",
    description: "100% Attendance • Eligible for 0.01 ETH!",
  },
  {
    role: "student",
    roleName: "Student",
    title: "🎒 DIVYA (2329321)",
    address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    privateKey: "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
    description: "80% Attendance • Eligible for 0.01 ETH!",
  },
  {
    role: "student",
    roleName: "Student",
    title: "🎒 KNISHK ARORA (2329366)",
    address: "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
    privateKey: "0x47e179ec197488593b100257e9e84869f430d44d73940fa6b7724409b300cd54",
    description: "60% Attendance • Locked (needs 1 class)",
  },
];

export function hasMetaMask() {
  return typeof window !== "undefined" && Boolean(window.ethereum);
}

/** Automatically requests MetaMask to add and switch to the Hardhat local network (Chain 31337) */
export async function autoSwitchOrAddNetwork() {
  if (!window.ethereum) throw new Error("MetaMask is not installed.");
  const hexChainId = "0x" + Number(deployment.chainId).toString(16);
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: hexChainId }],
    });
  } catch (err) {
    if (err.code === 4902 || err.code === -32603 || err?.message?.includes("Unrecognized chain ID")) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: hexChainId,
            chainName: "Hardhat Localhost",
            rpcUrls: ["http://127.0.0.1:8545"],
            nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
          },
        ],
      });
    } else {
      throw err;
    }
  }
}

export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error("MetaMask extension not found in this browser. Please install MetaMask or click any of the Quick Demo Sign-In options below.");
  }

  // Attempt automatic network switch / addition if needed
  try {
    await autoSwitchOrAddNetwork();
  } catch (_e) {
    // User might need to approve the prompt
  }

  const provider = new BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== deployment.chainId) {
    throw new Error(`Wrong network in MetaMask. Switch to chain ID ${deployment.chainId} (Local Hardhat: http://127.0.0.1:8545).`);
  }
  const signer = await provider.getSigner();
  const contract = new Contract(deployment.address, deployment.abi, signer);
  return { provider, signer, contract, address: (await signer.getAddress()).toLowerCase(), isDemo: false };
}

export async function connectDemoAccount(privateKey) {
  const provider = new JsonRpcProvider("http://127.0.0.1:8545");
  const signer = new Wallet(privateKey, provider);
  const contract = new Contract(deployment.address, deployment.abi, signer);
  const address = (await signer.getAddress()).toLowerCase();
  return { provider, signer, contract, address, isDemo: true };
}

/** Turns raw ethers/MetaMask errors into a short message a user can act on. */
export function readError(e) {
  if (e?.code === "ACTION_REJECTED" || e?.code === 4001) return "You rejected the transaction in MetaMask.";
  const reason = e?.reason || e?.revert?.args?.[0] || e?.info?.error?.message || e?.shortMessage || e?.message;
  return String(reason || "Something went wrong").replace(/^execution reverted: /, "").slice(0, 160);
}
