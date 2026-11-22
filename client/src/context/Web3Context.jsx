import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import contractInfo from "../contracts/contractInfo.json";

const Web3Context = createContext();

const DEMO_ACCOUNTS = [
  {
    role: "Admin (Revenue Dept)",
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    label: "Super Admin Officer",
  },
  {
    role: "Registrar (Sub-District)",
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    label: "Chief Registrar Prayagraj",
  },
  {
    role: "Citizen (Seller)",
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    label: "Rajesh Kumar Verma (Owner)",
  },
  {
    role: "Citizen (Buyer)",
    address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    label: "Amit Saxena (Buyer)",
  },
];

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("0");
  const [chainId, setChainId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [readOnlyContract, setReadOnlyContract] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRegistrar, setIsRegistrar] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeRoleName, setActiveRoleName] = useState("Citizen");

  // Initialize read-only fallback provider
  useEffect(() => {
    try {
      const rpcUrl = import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545";
      const fallbackProvider = new ethers.JsonRpcProvider(rpcUrl);
      if (contractInfo.contractAddress && contractInfo.abi) {
        const roContract = new ethers.Contract(contractInfo.contractAddress, contractInfo.abi, fallbackProvider);
        setReadOnlyContract(roContract);
      }
    } catch (e) {
      console.warn("Fallback RPC provider error:", e);
    }
  }, []);

  // Check roles for a given account
  const checkRoles = useCallback(async (walletAddr, contractInstance) => {
    if (!walletAddr) {
      setIsAdmin(false);
      setIsRegistrar(false);
      setActiveRoleName("Citizen");
      return;
    }

    const lowerAddr = walletAddr.toLowerCase();

    // Check predefined local demo addresses for instant authorization
    if (lowerAddr === "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266") {
      setIsAdmin(true);
      setIsRegistrar(true);
      setActiveRoleName("Super Admin & Registrar");
      return;
    }
    if (lowerAddr === "0x70997970c51812dc3a010c7d01b50e0d17dc79c8") {
      setIsAdmin(false);
      setIsRegistrar(true);
      setActiveRoleName("Registrar Officer");
      return;
    }

    // Check on-chain roles if contract is available
    if (contractInstance) {
      try {
        const DEFAULT_ADMIN = ethers.ZeroHash;
        const REGISTRAR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("REGISTRAR_ROLE"));

        const [adminRole, regRole] = await Promise.all([
          contractInstance.hasRole(DEFAULT_ADMIN, walletAddr),
          contractInstance.hasRole(REGISTRAR_ROLE, walletAddr),
        ]);

        setIsAdmin(adminRole);
        setIsRegistrar(regRole || adminRole);

        if (adminRole) setActiveRoleName("Super Admin");
        else if (regRole) setActiveRoleName("Registrar Officer");
        else setActiveRoleName("Citizen / Landholder");
        return;
      } catch (err) {
        console.warn("On-chain role lookup error:", err.message);
      }
    }

    // Default citizen
    setIsAdmin(false);
    setIsRegistrar(false);
    setActiveRoleName("Citizen / Landholder");
  }, []);

  // Update ETH balance
  const updateBalance = useCallback(async (walletAddr, prov) => {
    if (!walletAddr || !prov) return;
    try {
      const bal = await prov.getBalance(walletAddr);
      setBalance(parseFloat(ethers.formatEther(bal)).toFixed(4));
    } catch (e) {
      console.warn("Failed to fetch balance:", e);
    }
  }, []);

  // Connect MetaMask Wallet
  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      alert("MetaMask or Web3 wallet extension is not detected in your browser. Switching to simulation mode.");
      selectDemoAccount(DEMO_ACCOUNTS[0].address);
      return;
    }

    setIsConnecting(true);
    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      const network = await browserProvider.getNetwork();
      const currentSigner = await browserProvider.getSigner();
      const userAccount = accounts[0];

      setProvider(browserProvider);
      setSigner(currentSigner);
      setAccount(userAccount);
      setChainId(Number(network.chainId));

      const contractInstance = new ethers.Contract(
        contractInfo.contractAddress,
        contractInfo.abi,
        currentSigner
      );
      setContract(contractInstance);

      await updateBalance(userAccount, browserProvider);
      await checkRoles(userAccount, contractInstance);
    } catch (err) {
      console.error("Wallet connection failed:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  // Switch to demo account for evaluation & rapid testing
  const selectDemoAccount = async (targetAddress) => {
    setAccount(targetAddress);
    const rpcUrl = import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545";
    try {
      const jsonRpc = new ethers.JsonRpcProvider(rpcUrl);
      const demoSigner = await jsonRpc.getSigner(targetAddress);
      setProvider(jsonRpc);
      setSigner(demoSigner);

      const contractInstance = new ethers.Contract(
        contractInfo.contractAddress,
        contractInfo.abi,
        demoSigner
      );
      setContract(contractInstance);

      await updateBalance(targetAddress, jsonRpc);
      await checkRoles(targetAddress, contractInstance);
    } catch (e) {
      console.warn("Could not connect demo signer:", e.message);
      await checkRoles(targetAddress, null);
    }
  };

  // Listen to MetaMask account / chain changes
  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          connectWallet();
        } else {
          setAccount("");
          setSigner(null);
          setContract(null);
        }
      });

      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }
  }, []);

  return (
    <Web3Context.Provider
      value={{
        account,
        balance,
        chainId,
        provider,
        signer,
        contract: contract || readOnlyContract,
        readOnlyContract,
        isAdmin,
        isRegistrar,
        isConnecting,
        activeRoleName,
        connectWallet,
        selectDemoAccount,
        demoAccounts: DEMO_ACCOUNTS,
        contractAddress: contractInfo.contractAddress,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => useContext(Web3Context);
