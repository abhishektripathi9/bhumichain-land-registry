const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("==================================================================");
  console.log("  BHUMICHAIN POLYGON AMOY TESTNET DEPLOYMENT & VERIFICATION");
  console.log("  Chain ID: 80002 | RPC:", hre.network.config.url || "Polygon Amoy");
  console.log("==================================================================");

  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) {
    throw new Error(
      "Deployer wallet not found. Ensure PRIVATE_KEY is populated in contracts/.env"
    );
  }

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(">>> Deployer Address:", deployer.address);
  console.log(">>> Balance:", hre.ethers.formatEther(balance), "POL/MATIC");

  if (balance === 0n) {
    console.warn(
      "\n⚠️ WARNING: Deployer account has 0 POL balance on Polygon Amoy."
    );
    console.warn(
      "   Please obtain free testnet POL from https://faucet.polygon.technology/\n"
    );
  }

  // 1. Deploy LandRegistry
  console.log("\n[1/3] Deploying LandRegistry.sol to Polygon Amoy...");
  const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
  const landRegistry = await LandRegistry.deploy();
  await landRegistry.waitForDeployment();
  const landRegistryAddress = await landRegistry.getAddress();
  console.log("✓ LandRegistry deployed at:", landRegistryAddress);
  console.log("  Polygonscan Explorer:", `https://amoy.polygonscan.com/address/${landRegistryAddress}`);

  // 2. Deploy UPCadastreLandDeed
  console.log("\n[2/3] Deploying UPCadastreLandDeed.sol to Polygon Amoy...");
  const UPCadastreLandDeed = await hre.ethers.getContractFactory("UPCadastreLandDeed");
  const upCadastreLandDeed = await UPCadastreLandDeed.deploy();
  await upCadastreLandDeed.waitForDeployment();
  const upCadastreAddress = await upCadastreLandDeed.getAddress();
  console.log("✓ UPCadastreLandDeed deployed at:", upCadastreAddress);
  console.log("  Polygonscan Explorer:", `https://amoy.polygonscan.com/address/${upCadastreAddress}`);

  // Wait for 5 block confirmations before Polygonscan verification
  if (hre.network.name === "polygonAmoy") {
    console.log("\nWaiting for 5 block confirmations before verification...");
    await landRegistry.deploymentTransaction().wait(5);
    await upCadastreLandDeed.deploymentTransaction().wait(5);
  }

  // 3. Automated Polygonscan Verification
  if (process.env.POLYGONSCAN_API_KEY) {
    console.log("\n[3/3] Running automated source code verification on Polygonscan...");

    try {
      console.log("Verifying LandRegistry...");
      await hre.run("verify:verify", {
        address: landRegistryAddress,
        constructorArguments: [],
      });
      console.log("✓ LandRegistry successfully verified on Polygonscan!");
    } catch (err) {
      console.warn("Notice during LandRegistry verification:", err.message);
    }

    try {
      console.log("Verifying UPCadastreLandDeed...");
      await hre.run("verify:verify", {
        address: upCadastreAddress,
        constructorArguments: [],
      });
      console.log("✓ UPCadastreLandDeed successfully verified on Polygonscan!");
    } catch (err) {
      console.warn("Notice during UPCadastreLandDeed verification:", err.message);
    }
  } else {
    console.log("\n[3/3] Skipping verification (POLYGONSCAN_API_KEY not set in contracts/.env).");
  }

  // Read Artifact ABIs
  const landRegistryArtifact = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../artifacts/contracts/LandRegistry.sol/LandRegistry.json"),
      "utf8"
    )
  );
  const upCadastreArtifact = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../artifacts/contracts/UPCadastreLandDeed.sol/UPCadastreLandDeed.json"),
      "utf8"
    )
  );

  const deploymentData = {
    network: "polygonAmoy",
    chainId: 80002,
    contractAddress: landRegistryAddress,
    upCadastreAddress: upCadastreAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    explorerLinks: {
      landRegistry: `https://amoy.polygonscan.com/address/${landRegistryAddress}`,
      upCadastre: `https://amoy.polygonscan.com/address/${upCadastreAddress}`,
    },
    abi: landRegistryArtifact.abi,
    upCadastreAbi: upCadastreArtifact.abi,
  };

  // Export deployment info to server and client
  const serverPath = path.join(__dirname, "../../server/src/config/contractInfo.amoy.json");
  const clientPath = path.join(__dirname, "../../client/src/contracts/contractInfo.amoy.json");

  fs.mkdirSync(path.dirname(serverPath), { recursive: true });
  fs.writeFileSync(serverPath, JSON.stringify(deploymentData, null, 2));

  fs.mkdirSync(path.dirname(clientPath), { recursive: true });
  fs.writeFileSync(clientPath, JSON.stringify(deploymentData, null, 2));

  console.log("\n✓ Polygon Amoy contract configs successfully exported to client and server!");
  console.log("==================================================================");
}

main().catch((error) => {
  console.error("Deployment script failed:", error);
  process.exitCode = 1;
});
