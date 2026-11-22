import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Property from "../models/Property.js";
import Transaction from "../models/Transaction.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function startBlockchainListener() {
  const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
  const configPath = path.join(__dirname, "../config/contractInfo.json");

  if (!fs.existsSync(configPath)) {
    console.log(">>> [Listener Service] contractInfo.json not found yet. Run 'npm run contracts:deploy' to activate live on-chain event sync.");
    return;
  }

  try {
    const contractInfo = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const { contractAddress, abi } = contractInfo;

    if (!contractAddress || !abi || abi.length === 0) {
      console.log(">>> [Listener Service] No contract address configured.");
      return;
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Verify RPC connectivity
    try {
      await provider.getBlockNumber();
    } catch (e) {
      console.warn(">>> [Listener Service] Could not connect to RPC provider at", rpcUrl, "Event listener will retry automatically.");
      return;
    }

    const contract = new ethers.Contract(contractAddress, abi, provider);
    console.log(`>>> [Listener Service] Active: Listening to events on LandRegistry @ ${contractAddress}`);

    // 1. LandRegistered Event
    contract.on("LandRegistered", async (landId, khasraNumber, owner, area, price, ipfsHash, event) => {
      try {
        const idNum = Number(landId);
        console.log(`>>> [Event] LandRegistered on-chain ID: ${idNum}, Khasra: ${khasraNumber}`);
        await Property.findOneAndUpdate(
          { khasraNumber },
          {
            $set: {
              onChainId: idNum,
              ownerWallet: owner.toLowerCase(),
              area: Number(area),
              price: ethers.formatEther(price),
              ipfsCid: ipfsHash,
            },
          },
          { new: true }
        );
      } catch (err) {
        console.error("Error processing LandRegistered event:", err);
      }
    });

    // 2. LandVerified Event
    contract.on("LandVerified", async (landId, approved, registrar, event) => {
      try {
        const idNum = Number(landId);
        console.log(`>>> [Event] LandVerified ID: ${idNum}, Approved: ${approved}`);
        await Property.findOneAndUpdate(
          { onChainId: idNum },
          {
            $set: {
              status: approved ? "Verified" : "Rejected",
            },
          }
        );
      } catch (err) {
        console.error("Error processing LandVerified event:", err);
      }
    });

    // 3. ForSaleToggled Event
    contract.on("ForSaleToggled", async (landId, isForSale, price, event) => {
      try {
        const idNum = Number(landId);
        console.log(`>>> [Event] ForSaleToggled ID: ${idNum}, ForSale: ${isForSale}`);
        await Property.findOneAndUpdate(
          { onChainId: idNum },
          {
            $set: {
              isForSale,
              price: ethers.formatEther(price),
            },
          }
        );
      } catch (err) {
        console.error("Error processing ForSaleToggled event:", err);
      }
    });

    // 4. EscrowInitiated Event
    contract.on("EscrowInitiated", async (landId, buyer, amount, event) => {
      try {
        const idNum = Number(landId);
        console.log(`>>> [Event] EscrowInitiated ID: ${idNum}, Buyer: ${buyer}`);
        const property = await Property.findOne({ onChainId: idNum });
        if (property) {
          await Transaction.findOneAndUpdate(
            { onChainId: idNum, escrowStatus: "INITIATED" },
            {
              txHash: event?.log?.transactionHash || `0x${Date.now()}${idNum}`,
              propertyId: property._id,
              onChainId: idNum,
              buyerWallet: buyer.toLowerCase(),
              sellerWallet: property.ownerWallet.toLowerCase(),
              amount: ethers.formatEther(amount),
              escrowStatus: "INITIATED",
              timestamp: new Date(),
            },
            { upsert: true, new: true }
          );
        }
      } catch (err) {
        console.error("Error processing EscrowInitiated event:", err);
      }
    });

    // 5. OwnershipTransferred Event
    contract.on("OwnershipTransferred", async (landId, previousOwner, newOwner, price, event) => {
      try {
        const idNum = Number(landId);
        console.log(`>>> [Event] OwnershipTransferred ID: ${idNum} from ${previousOwner} to ${newOwner}`);
        const property = await Property.findOne({ onChainId: idNum });
        if (property) {
          const newHistoryItem = {
            ownerName: `Owner (${newOwner.slice(0, 6)}...${newOwner.slice(-4)})`,
            ownerWallet: newOwner.toLowerCase(),
            fromDate: new Date().toISOString().split("T")[0],
            toDate: "Present",
            txHash: event?.log?.transactionHash || "On-Chain Escrow Transfer",
          };

          // Mark previous current record toDate
          if (property.ownershipHistory && property.ownershipHistory.length > 0) {
            property.ownershipHistory[property.ownershipHistory.length - 1].toDate = new Date().toISOString().split("T")[0];
          }

          property.ownershipHistory.push(newHistoryItem);
          property.ownerWallet = newOwner.toLowerCase();
          property.isForSale = false;
          await property.save();

          await Transaction.findOneAndUpdate(
            { onChainId: idNum, escrowStatus: "INITIATED" },
            { $set: { escrowStatus: "COMPLETED" } }
          );
        }
      } catch (err) {
        console.error("Error processing OwnershipTransferred event:", err);
      }
    });

    // 6. DisputeUpdated Event
    contract.on("DisputeUpdated", async (landId, isDisputed, registrar, event) => {
      try {
        const idNum = Number(landId);
        console.log(`>>> [Event] DisputeUpdated ID: ${idNum}, Disputed: ${isDisputed}`);
        await Property.findOneAndUpdate(
          { onChainId: idNum },
          {
            $set: {
              disputeStatus: isDisputed,
              status: isDisputed ? "Disputed" : "Verified",
              isForSale: isDisputed ? false : undefined,
              disputeRemarks: isDisputed
                ? "Court injunction or freezing order applied by Registrar."
                : "Dispute resolved. Title cleared.",
            },
          }
        );
      } catch (err) {
        console.error("Error processing DisputeUpdated event:", err);
      }
    });

    // 7. EscrowCancelled Event
    contract.on("EscrowCancelled", async (landId, buyer, amount, event) => {
      try {
        const idNum = Number(landId);
        console.log(`>>> [Event] EscrowCancelled ID: ${idNum}`);
        await Transaction.findOneAndUpdate(
          { onChainId: idNum, escrowStatus: "INITIATED" },
          { $set: { escrowStatus: "CANCELLED" } }
        );
      } catch (err) {
        console.error("Error processing EscrowCancelled event:", err);
      }
    });
  } catch (err) {
    console.error("Failed to start blockchain listener service:", err.message);
  }
}
