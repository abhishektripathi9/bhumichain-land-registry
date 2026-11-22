# BhumiChain — Production-Grade Web3 & GIS Land Registry DApp

BhumiChain is a full-stack decentralized Web3 & GIS Land Registry system designed for real-world municipal and state revenue deployment (such as UP Bhulekh / Bhu-Naksha).

The system enables a buyer standing on any physical land parcel to detect the plot boundary under their feet using high-precision GPS point-in-polygon matching, verify authentic ownership history and fraud/court injunction/mortgage status, chat directly with the verified landowner over decentralized channels without middlemen, purchase land parcels through Smart Contract Escrow, and allows Government Registrars & Super Admins to verify title deeds, manage disputes, and bulk-import real GIS cadastral records.

---

## 1. System Architecture & 4-Layer Backend

```
├── /contracts                    # Smart Contracts (Hardhat + Solidity ^0.8.20 + OpenZeppelin)
│   ├── contracts/LandRegistry.sol # AccessControl, ReentrancyGuard, Escrow, Cadastral Registry
│   ├── scripts/deploy.cjs        # Deploys contract and exports ABI/Address to /server & /client
│   └── test/LandRegistry.test.cjs# Comprehensive 8-test automated suite (100% passing)
│
├── /server                       # 4-Layer Backend Architecture
│   ├── src/config                # Layer 3/4: MongoDB & Web3 Provider Config
│   ├── src/controllers           # Layer 1/2/4: REST Controllers & Geospatial Engine
│   │   ├── propertyController.js # Point-in-polygon ($geoIntersects), $near proximity, Search
│   │   ├── adminController.js    # GeoJSON Bulk Ingestion, Verifications, Dispute Freeze
│   │   ├── chatController.js     # Buyer-Seller message persistence & room channels
│   │   ├── ipfsController.js     # Pinata Cloud IPFS upload with local standalone fallback
│   │   └── authController.js     # Role verification & profile management
│   ├── src/models                # Layer 3: MongoDB Schemas (User, Property [2dsphere], Transaction, Message)
│   ├── src/routes                # Layer 1: Express REST API Endpoints
│   ├── src/seeds                 # 12 Realistic Prayagraj (Civil Lines & Naini) Cadastral Plots
│   ├── src/services/listenerService.js # Layer 4: Ethers.js v6 on-chain event sync daemon
│   └── src/server.js             # Layer 1: Express Server + Socket.io Real-Time Gateway
│
└── /client                       # Responsive Web3 & GIS Frontend (React + Vite + Tailwind + Leaflet)
    ├── src/components/Navbar.jsx            # Role badge, quick test account switcher, wallet connector
    ├── src/components/MapExplorer.jsx      # Full-screen Leaflet GIS map, Satellite/Street toggle, GPS scanner
    ├── src/components/LandDossierDrawer.jsx # Slide-over dossier, fraud alert, deed viewer, QR cert, Escrow buy
    ├── src/components/ChatModal.jsx        # Real-time Socket.io buyer-seller messaging room
    ├── src/components/RegisterLand.jsx     # Leaflet-Draw boundary polygon plotter & IPFS deed upload
    ├── src/components/MyProperties.jsx     # Owned parcels, list for sale modal, active escrow tracker
    ├── src/components/AdminPanel.jsx       # 4-Tab Registrar Console: Verifications, Escrow, Disputes, GeoJSON Importer
    └── src/context/Web3Context.jsx         # MetaMask wallet management, role queries, Hardhat account switcher
```

### 4-Layer Backend Design
- **Layer 1 (API & Real-Time Gateway):** Express REST endpoints + Socket.io server managing real-time buyer-seller chat rooms per property parcel.
- **Layer 2 (Geospatial & Verification Engine):** MongoDB `$geoIntersects` and `$near` queries for instant point-in-polygon matching when users scan GPS coordinates or click polygons.
- **Layer 3 (Off-Chain Database - MongoDB):** Stores enriched cadastral records with `2dsphere` spatial indexing, Aadhaar KYC references, bank mortgage details, dispute history, and transaction logs.
- **Layer 4 (Web3 & IPFS Sync Bridge):** Pinata IPFS file pinning bridge + background Ethers.js v6 listener service continuously syncing on-chain events (`LandRegistered`, `LandVerified`, `OwnershipTransferred`, `DisputeUpdated`, `EscrowApproved`) into MongoDB.

---

## 2. Smart Contract Specifications (`LandRegistry.sol`)

Implemented using Solidity `^0.8.20` and OpenZeppelin:
- **`AccessControl`**: Manages `DEFAULT_ADMIN_ROLE` (Super Admin) and `REGISTRAR_ROLE` (Government Sub-Registrar).
- **`ReentrancyGuard`**: Protects escrow deposit, refund, and disbursement functions against reentrancy exploits.
- **Core Methods**:
  - `registerLand(khasraNumber, location, area, price, ipfsHash)`: Citizen registration.
  - `verifyLand(landId, approved)`: `onlyRole(REGISTRAR_ROLE)`.
  - `toggleForSale(landId, price)`: Owner listing controls (reverts if disputed or unverified).
  - `initiateEscrowBuy(landId)`: `payable`, locks buyer funds securely in the contract.
  - `approveOwnershipTransfer(landId)`: `onlyRole(REGISTRAR_ROLE)`, releases escrowed funds to seller, updates ownership to buyer, and clears listing.
  - `cancelEscrow(landId)`: Refunds escrowed ETH back to buyer.
  - `setDisputeStatus(landId, status)`: `onlyRole(REGISTRAR_ROLE)`, freezes or unfreezes land titles.
  - `batchImportLands(...)`: Bulk cadastral ingestion for Revenue Admins.

---

## 3. Real-World GIS Dataset (Prayagraj / Allahabad)

The system includes 12 realistic cadastral land parcels in Prayagraj (Civil Lines & Naini):
- **4 Parcels Verified & For Sale (Green)**
- **4 Parcels Verified & Private Possession (Blue)**
- **2 Parcels Mortgaged / Court Injunction Disputed (Red)**
- **2 Parcels Awaiting Lekhpal Field Verification (Amber)**

Coordinates use true GeoJSON `[longitude, latitude]` format around Prayagraj:
- **Civil Lines (Sadar Tehsil):** ~`25.4530° N, 81.8310° E`
- **Naini (Karchhana Tehsil):** ~`25.3910° N, 81.8560° E`

---

## 4. Step-by-Step Setup & Running Guide

### Prerequisites
- Node.js (v18+ or v20+)
- npm
- (Optional) MongoDB local service or MongoDB Atlas (app includes an automatic in-memory GIS cadastral fallback with seed data if MongoDB is not running locally).

### Step 1: Install Dependencies
Run in project root:
```bash
# Install root, contracts, server, and client dependencies
npm --prefix contracts install
npm --prefix server install
npm --prefix client install
```

### Step 2: Compile & Test Smart Contracts
Run unit tests to verify the 8-test smart contract suite:
```bash
npm run contracts:test
```
*Expected result:* `8 passing`

### Step 3: Start Hardhat Local Node & Deploy
In Terminal 1, start the Hardhat local blockchain node:
```bash
npm run contracts:node
```
In Terminal 2, deploy the smart contract to the local node:
```bash
npm run contracts:deploy
```
*This deploys `LandRegistry` to `0x5FbDB2315678afecb367f032d93F642f64180aa3` and automatically exports configuration and ABI to both `/server` and `/client`.*

### Step 4: Seed MongoDB & Start Backend Server
In Terminal 3:
```bash
# Optional: Seed live MongoDB with 12 Prayagraj parcels
npm run server:seed

# Start the 4-layer backend server
npm run server:start
```
*API Gateway will run at: `http://localhost:5000/api/health`*

### Step 5: Start Frontend Client
In Terminal 4:
```bash
npm run client:dev
```
*Open your browser at: `http://localhost:3000`*

---

## 5. Walkthrough of Key Features

### 1. Interactive GIS Map Explorer (Home)
- Switch between **Satellite 3D** (Esri World Imagery) and **Street Map** (OpenStreetMap).
- Click any color-coded land polygon to open its **Land Dossier Drawer**.
- Click **"Find Plot Under Me (GPS)"** on your mobile device, or click one of the quick simulation buttons (**"Civil Lines (142/1)"** or **"Naini (201/Gha)"**) to execute point-in-polygon matching.

### 2. Slide-Over Land Dossier Drawer
- Inspect Khasra, Khata, Village, Tehsil, Area (m² & Ha), and Circle Rate valuation.
- Verify the **Fraud & Dispute Alert Badge** (shows clean title vs bank SARFAESI mortgage lien or court injunction).
- Review the **Chain of Custody Timeline** showing immutable historical owners and transactions.
- Preview the **IPFS Registry Deed** with cryptographic CID.
- Generate and scan the **QR Code Land Title Certificate**.

### 3. Direct Buyer-Seller Chat (Socket.io)
- Click **"Chat with Owner"** on any plot dossier.
- Negotiate price or schedule on-site field visits in real-time.

### 4. Smart Contract Escrow Purchase
- For any plot listed for sale, click **"Buy via Escrow"**.
- The buyer deposits the exact asking ETH into the `LandRegistry.sol` contract.
- The funds remain locked securely in the contract awaiting Registrar title clearance.

### 5. Government Registrar & Super Admin Panel (`/admin`)
- Switch to the Registrar demo account (`0x7099...79C8`) using the top-right role switcher.
- **Tab 1 (Pending Verifications):** Split-screen review comparing citizen metadata with the embedded IPFS deed scan. Click **Approve** or **Reject**.
- **Tab 2 (Escrow Transfer Approvals):** Inspect active deals where buyer ETH is locked. Click **Execute Deed & Disburse Funds** to transfer ownership to the buyer and disburse funds to the seller.
- **Tab 3 (Dispute Control):** Freeze or unfreeze any land parcel title with one click.
- **Tab 4 (Real Data GeoJSON Importer):** Drag-and-drop any `.geojson` exported from `geojson.io` or UP Bhulekh. Preview the polygons on the live map and click **Commit GeoJSON to Cadastral Database**.

---

## 6. Pre-Configured Test Accounts (Hardhat)

| Role | Account Address | Balance | Purpose |
|------|-----------------|---------|---------|
| **Super Admin** | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | 10,000 ETH | Contract deployer, Role manager, Bulk GeoJSON importer |
| **Registrar Officer** | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | 10,000 ETH | Sub-Registrar Prayagraj: Approves deeds & executes escrow transfers |
| **Citizen (Seller)** | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | 10,000 ETH | Owner of Civil Lines Plot 142/1 & Naini Plot 201/Gha |
| **Citizen (Buyer)** | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | 10,000 ETH | Verified Buyer (Amit Saxena): Initiates escrow purchases |

---

## 7. License
Licensed under the Apache-2.0 / MIT License.
