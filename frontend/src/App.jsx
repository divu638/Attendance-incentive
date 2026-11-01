import React, { useState, useCallback, useEffect } from "react";
import {
  connectWallet,
  connectDemoAccount,
  autoSwitchOrAddNetwork,
  hasMetaMask,
  DEMO_ACCOUNTS,
  readError,
  CONTRACT_ADDRESS,
} from "./chain.js";
import { api, setToken } from "./api.js";
import Admin from "./pages/Admin.jsx";
import Teacher from "./pages/Teacher.jsx";
import Student from "./pages/Student.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import Sidebar from "./components/Sidebar.jsx";
import TopNavbar from "./components/TopNavbar.jsx";
import WalletModal from "./components/WalletModal.jsx";
import ThreeBackground from "./components/ThreeBackground.jsx";

export default function App() {
  const [session, setSession] = useState(null); // { contract, address, role, isDemo, title }
  const [activeTab, setActiveTab] = useState("overview");
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("attendify-theme") || "light");

  // Sync theme attribute on document root
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("attendify-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }, []);

  const notify = useCallback((text, kind = "ok") => {
    setToast({ text, kind });
    setTimeout(() => setToast(null), 5000);
  }, []);

  // Executes a blockchain transaction with responsive UX feedback
  const sendTx = useCallback(
    async (label, fn) => {
      const isDemo = session?.isDemo;
      notify(`${label}: ${isDemo ? "broadcasting to local chain…" : "confirm in MetaMask…"}`, "wait");
      try {
        const tx = await fn();
        notify(`${label}: mining transaction on-chain…`, "wait");
        await tx.wait();
        notify(`${label}: confirmed on blockchain!`);
        return tx;
      } catch (e) {
        notify(`${label} failed: ${readError(e)}`, "error");
        return null;
      }
    },
    [notify, session]
  );

  async function loginWallet() {
    setBusy(true);
    setError("");
    try {
      const w = await connectWallet();
      const { message } = await api.nonce(w.address);
      const signature = await w.signer.signMessage(message);
      const { token, role } = await api.verify(w.address, signature);
      setToken(token);
      setSession({ contract: w.contract, address: w.address, role, isDemo: false, title: "" });
      setActiveTab("overview");
      setWalletModalOpen(false);
      notify(`🎉 Connected successfully as ${role.toUpperCase()}!`);
    } catch (e) {
      setError(readError(e));
      notify(`❌ Connection failed: ${readError(e)}`, "error");
    } finally {
      setBusy(false);
    }
  }

  async function loginDemo(account) {
    setBusy(true);
    setError("");
    try {
      const w = await connectDemoAccount(account.privateKey);
      const { message } = await api.nonce(w.address);
      const signature = await w.signer.signMessage(message);
      const { token, role } = await api.verify(w.address, signature);
      setToken(token);
      setSession({
        contract: w.contract,
        address: w.address,
        role,
        isDemo: true,
        title: account.title,
      });
      setActiveTab("overview");
      setWalletModalOpen(false);
      notify(`⚡ Signed in as Demo ${account.roleName}!`);
    } catch (e) {
      setError(readError(e));
      notify(`❌ Demo login failed: ${readError(e)}`, "error");
    } finally {
      setBusy(false);
    }
  }

  async function loginWithCredentials(identifier, password) {
    setBusy(true);
    setError("");
    try {
      const res = await api.login(identifier, password);
      setToken(res.token);

      let contractInstance = null;
      let userAddress = (res.user?.walletAddress || res.address || "").toLowerCase();
      let isDemoMode = false;

      if (res.privateKey) {
        const w = await connectDemoAccount(res.privateKey);
        contractInstance = w.contract;
        userAddress = w.address;
        isDemoMode = true;
      }

      setSession({
        contract: contractInstance,
        address: userAddress,
        role: res.role,
        isDemo: isDemoMode,
        title: res.user?.name ? `${res.user.name} (${res.user.rollNo || res.role.toUpperCase()})` : "",
        user: res.user,
      });

      setActiveTab("overview");
      setWalletModalOpen(false);
      notify(`🎉 Welcome, ${res.user?.name || res.role.toUpperCase()}! Signed in to Attendify.`);
    } catch (e) {
      setError(readError(e));
      notify(`❌ Login failed: ${readError(e)}`, "error");
    } finally {
      setBusy(false);
    }
  }

  const handleAddNetwork = async () => {
    try {
      setBusy(true);
      await autoSwitchOrAddNetwork();
      notify("🦊 Hardhat Local (Chain ID 31337) configured in MetaMask!");
    } catch (e) {
      notify(`Could not auto-configure network: ${readError(e)}`, "error");
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    setToken(null);
    setSession(null);
    setActiveTab("overview");
    notify("👋 Logged out from Attendify.");
  };

  return (
    <div data-theme={theme} style={{ minHeight: "100vh", position: "relative" }}>
      {/* 3D Floating Geometry & Particle Constellations */}
      <ThreeBackground />

      {!session ? (
        <div style={{ position: "relative", zIndex: 1 }}>
          <LandingPage openConnectModal={() => setWalletModalOpen(true)} />
          <WalletModal
            isOpen={walletModalOpen}
            onClose={() => setWalletModalOpen(false)}
            loginWallet={loginWallet}
            loginDemo={loginDemo}
            loginWithCredentials={loginWithCredentials}
            busy={busy}
            error={error}
            handleAddNetwork={handleAddNetwork}
          />
        </div>
      ) : (
        <div className="app-layout" style={{ position: "relative", zIndex: 1 }}>
          {/* Persistent Left Sidebar */}
          <Sidebar session={session} activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Main Content Area */}
          <div className="main-wrapper">
            <TopNavbar
              session={session}
              logout={logout}
              notify={notify}
              activeTab={activeTab}
              theme={theme}
              toggleTheme={toggleTheme}
            />

            <main className="content-area">
              {session.role === "admin" && (
                <Admin
                  contract={session.contract}
                  address={session.address}
                  sendTx={sendTx}
                  notify={notify}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  theme={theme}
                  toggleTheme={toggleTheme}
                />
              )}
              {session.role === "teacher" && (
                <Teacher
                  contract={session.contract}
                  address={session.address}
                  sendTx={sendTx}
                  notify={notify}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  theme={theme}
                  toggleTheme={toggleTheme}
                />
              )}
              {session.role === "student" && (
                <Student
                  contract={session.contract}
                  address={session.address}
                  sendTx={sendTx}
                  notify={notify}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  theme={theme}
                  toggleTheme={toggleTheme}
                />
              )}
              {session.role === "none" && (
                <div className="card" style={{ textAlign: "center", padding: "4rem 2rem", maxWidth: "600px", margin: "2rem auto" }}>
                  <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🎒</div>
                  <h2 style={{ marginBottom: "0.5rem" }}>Wallet Not Registered</h2>
                  <p className="muted" style={{ margin: "0 auto 1.5rem", maxWidth: "420px" }}>
                    This wallet address (<code>{session.address}</code>) has not yet been registered on the Attendify smart contract.
                  </p>
                  <p className="muted" style={{ fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                    Ask your department administrator to authorize you as a faculty teacher, or ask an instructor to register you as a student.
                  </p>
                  <button type="button" className="btn-primary" onClick={logout}>
                    Sign in with Another Account
                  </button>
                </div>
              )}
            </main>
          </div>
        </div>
      )}

      {toast && (
        <div className={"toast " + toast.kind} role="status">
          {toast.text}
        </div>
      )}
    </div>
  );
}
