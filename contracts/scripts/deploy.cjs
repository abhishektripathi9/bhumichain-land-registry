const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying smart contracts to network:", hre.network.name);

  const [deployer, officer] = await hre.ethers.getSigners();
  console.log("Deployer account:", deployer.address);

  // 1. Deploy LandRegistry
  const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
  const landRegistry = await LandRegistry.deploy();
  await landRegistry.waitForDeployment();
  const landRegistryAddress = await landRegistry.getAddress();
  console.log(">>> LandRegistry deployed at:", landRegistryAddress);

  // 2. Deploy UPCadastreLandDeed
  const UPCadastreLandDeed = await hre.ethers.getContractFactory("UPCadastreLandDeed");
  const upCadastreLandDeed = await UPCadastreLandDeed.deploy();
  await upCadastreLandDeed.waitForDeployment();
  const upCadastreAddress = await upCadastreLandDeed.getAddress();
  console.log(">>> UPCadastreLandDeed deployed at:", upCadastreAddress);

  // Read Artifact ABIs
  const landRegistryArtifact = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../artifacts/contracts/LandRegistry.sol/LandRegistry.json"), "utf8")
  );
  const upCadastreArtifact = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../artifacts/contracts/UPCadastreLandDeed.sol/UPCadastreLandDeed.json"), "utf8")
  );

  const deploymentData = {
    contractAddress: landRegistryAddress,
    upCadastreAddress: upCadastreAddress,
    network: hre.network.name,
    deployer: deployer.address,
    officer: officer ? officer.address : "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    deployedAt: new Date().toISOString(),
    abi: landRegistryArtifact.abi,
    upCadastreAbi: upCadastreArtifact.abi,
  };

  // Export to /server/src/config/contractInfo.json
  const serverConfigDir = path.join(__dirname, "../../server/src/config");
  fs.mkdirSync(serverConfigDir, { recursive: true });
  fs.writeFileSync(
    path.join(serverConfigDir, "contractInfo.json"),
    JSON.stringify(deploymentData, null, 2)
  );

  // Export to /client/src/contracts/contractInfo.json
  const clientConfigDir = path.join(__dirname, "../../client/src/contracts");
  fs.mkdirSync(clientConfigDir, { recursive: true });
  fs.writeFileSync(
    path.join(clientConfigDir, "contractInfo.json"),
    JSON.stringify(deploymentData, null, 2)
  );

  console.log("Successfully exported LandRegistry and UPCadastreLandDeed artifacts to server and client!");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
