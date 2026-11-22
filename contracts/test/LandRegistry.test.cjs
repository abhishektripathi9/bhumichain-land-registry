const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LandRegistry Smart Contract Tests", function () {
  let LandRegistry;
  let landRegistry;
  let owner, registrar, citizenSeller, citizenBuyer, unauthorized;

  beforeEach(async function () {
    [owner, registrar, citizenSeller, citizenBuyer, unauthorized] = await ethers.getSigners();

    LandRegistry = await ethers.getContractFactory("LandRegistry");
    landRegistry = await LandRegistry.deploy();
    await landRegistry.waitForDeployment();

    // Grant REGISTRAR_ROLE to registrar
    const REGISTRAR_ROLE = await landRegistry.REGISTRAR_ROLE();
    await landRegistry.grantRole(REGISTRAR_ROLE, registrar.address);
  });

  it("Should correctly set up roles for deployer and granted registrar", async function () {
    const DEFAULT_ADMIN_ROLE = await landRegistry.DEFAULT_ADMIN_ROLE();
    const REGISTRAR_ROLE = await landRegistry.REGISTRAR_ROLE();

    expect(await landRegistry.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    expect(await landRegistry.hasRole(REGISTRAR_ROLE, owner.address)).to.be.true;
    expect(await landRegistry.hasRole(REGISTRAR_ROLE, registrar.address)).to.be.true;
    expect(await landRegistry.hasRole(REGISTRAR_ROLE, unauthorized.address)).to.be.false;
  });

  it("Should allow a citizen to register land and emit LandRegistered event", async function () {
    const tx = await landRegistry.connect(citizenSeller).registerLand(
      "142/A",
      "Naini, Prayagraj, Uttar Pradesh",
      2500,
      ethers.parseEther("1.5"),
      "QmSeedHash123456789NainiParcel1"
    );

    await expect(tx)
      .to.emit(landRegistry, "LandRegistered")
      .withArgs(1, "142/A", citizenSeller.address, 2500, ethers.parseEther("1.5"), "QmSeedHash123456789NainiParcel1");

    const land = await landRegistry.getLand(1);
    expect(land.khasraNumber).to.equal("142/A");
    expect(land.currentOwner).to.equal(citizenSeller.address);
    expect(land.isVerified).to.be.false;
    expect(land.isForSale).to.be.false;
  });

  it("Should allow Registrar to verify or reject land", async function () {
    await landRegistry.connect(citizenSeller).registerLand(
      "143/B",
      "Civil Lines, Prayagraj",
      3200,
      ethers.parseEther("2.0"),
      "QmDeedCivilLines143"
    );

    // Unauthorized attempt should fail
    await expect(
      landRegistry.connect(unauthorized).verifyLand(1, true)
    ).to.be.reverted;

    // Registrar approves
    await expect(landRegistry.connect(registrar).verifyLand(1, true))
      .to.emit(landRegistry, "LandVerified")
      .withArgs(1, true, registrar.address);

    let land = await landRegistry.getLand(1);
    expect(land.isVerified).to.be.true;

    // Registrar rejects
    await landRegistry.connect(registrar).verifyLand(1, false);
    land = await landRegistry.getLand(1);
    expect(land.isVerified).to.be.false;
  });

  it("Should allow verified owner to list land for sale and prevent unverified/disputed listing", async function () {
    await landRegistry.connect(citizenSeller).registerLand(
      "144/C",
      "Naini, Prayagraj",
      1500,
      ethers.parseEther("1.0"),
      "QmHash144"
    );

    // Listing unverified land should fail
    await expect(
      landRegistry.connect(citizenSeller).toggleForSale(1, ethers.parseEther("1.2"))
    ).to.be.revertedWith("Land must be verified before listing");

    // Registrar verifies
    await landRegistry.connect(registrar).verifyLand(1, true);

    // Non-owner cannot list
    await expect(
      landRegistry.connect(unauthorized).toggleForSale(1, ethers.parseEther("1.2"))
    ).to.be.revertedWith("Only current owner can list");

    // Owner lists for sale
    await expect(
      landRegistry.connect(citizenSeller).toggleForSale(1, ethers.parseEther("1.2"))
    )
      .to.emit(landRegistry, "ForSaleToggled")
      .withArgs(1, true, ethers.parseEther("1.2"));

    let land = await landRegistry.getLand(1);
    expect(land.isForSale).to.be.true;
    expect(land.price).to.equal(ethers.parseEther("1.2"));
  });

  it("Should handle the complete Escrow Purchase lifecycle", async function () {
    // 1. Register & Verify Land
    await landRegistry.connect(citizenSeller).registerLand(
      "205/D",
      "Civil Lines, Prayagraj",
      1800,
      ethers.parseEther("2.0"),
      "QmDeedCivilLines205"
    );
    await landRegistry.connect(registrar).verifyLand(1, true);

    // 2. List For Sale
    await landRegistry.connect(citizenSeller).toggleForSale(1, ethers.parseEther("2.0"));

    // 3. Buyer initiates escrow with exact ETH
    await expect(
      landRegistry.connect(citizenBuyer).initiateEscrowBuy(1, { value: ethers.parseEther("1.0") })
    ).to.be.revertedWith("Exact land price must be deposited");

    const escrowTx = await landRegistry.connect(citizenBuyer).initiateEscrowBuy(1, { value: ethers.parseEther("2.0") });
    await expect(escrowTx)
      .to.emit(landRegistry, "EscrowInitiated")
      .withArgs(1, citizenBuyer.address, ethers.parseEther("2.0"));

    const deal = await landRegistry.getEscrowDeal(1);
    expect(deal.isActive).to.be.true;
    expect(deal.buyer).to.equal(citizenBuyer.address);
    expect(deal.amount).to.equal(ethers.parseEther("2.0"));

    // 4. Registrar approves escrow & ownership transfer
    const sellerInitialBalance = await ethers.provider.getBalance(citizenSeller.address);

    const approveTx = await landRegistry.connect(registrar).approveOwnershipTransfer(1);
    await expect(approveTx)
      .to.emit(landRegistry, "EscrowApproved")
      .withArgs(1, citizenSeller.address, citizenBuyer.address, ethers.parseEther("2.0"));
    await expect(approveTx)
      .to.emit(landRegistry, "OwnershipTransferred")
      .withArgs(1, citizenSeller.address, citizenBuyer.address, ethers.parseEther("2.0"));

    const sellerFinalBalance = await ethers.provider.getBalance(citizenSeller.address);
    expect(sellerFinalBalance - sellerInitialBalance).to.equal(ethers.parseEther("2.0"));

    const updatedLand = await landRegistry.getLand(1);
    expect(updatedLand.currentOwner).to.equal(citizenBuyer.address);
    expect(updatedLand.isForSale).to.be.false;

    const completedDeal = await landRegistry.getEscrowDeal(1);
    expect(completedDeal.isActive).to.be.false;
  });

  it("Should allow cancelling escrow and returning funds to buyer", async function () {
    await landRegistry.connect(citizenSeller).registerLand("301", "Naini", 1000, ethers.parseEther("1.0"), "Qm301");
    await landRegistry.connect(registrar).verifyLand(1, true);
    await landRegistry.connect(citizenSeller).toggleForSale(1, ethers.parseEther("1.0"));

    await landRegistry.connect(citizenBuyer).initiateEscrowBuy(1, { value: ethers.parseEther("1.0") });

    const buyerInitialBalance = await ethers.provider.getBalance(citizenBuyer.address);

    // Buyer cancels escrow
    const cancelTx = await landRegistry.connect(citizenBuyer).cancelEscrow(1);
    const receipt = await cancelTx.wait();
    const gasUsed = receipt.gasUsed * receipt.gasPrice;

    const buyerFinalBalance = await ethers.provider.getBalance(citizenBuyer.address);
    expect(buyerFinalBalance + gasUsed - buyerInitialBalance).to.equal(ethers.parseEther("1.0"));

    const deal = await landRegistry.getEscrowDeal(1);
    expect(deal.isActive).to.be.false;
  });

  it("Should allow Registrar to freeze and unfreeze disputed lands", async function () {
    await landRegistry.connect(citizenSeller).registerLand("401", "Prayagraj", 1000, ethers.parseEther("1.0"), "Qm401");
    await landRegistry.connect(registrar).verifyLand(1, true);
    await landRegistry.connect(citizenSeller).toggleForSale(1, ethers.parseEther("1.0"));

    // Registrar flags dispute
    await expect(landRegistry.connect(registrar).setDisputeStatus(1, true))
      .to.emit(landRegistry, "DisputeUpdated")
      .withArgs(1, true, registrar.address);

    let land = await landRegistry.getLand(1);
    expect(land.isDisputed).to.be.true;
    expect(land.isForSale).to.be.false;

    // Attempting escrow buy on disputed land should fail
    await expect(
      landRegistry.connect(citizenBuyer).initiateEscrowBuy(1, { value: ethers.parseEther("1.0") })
    ).to.be.revertedWith("Land is not listed for sale");

    // Registrar lifts dispute
    await landRegistry.connect(registrar).setDisputeStatus(1, false);
    land = await landRegistry.getLand(1);
    expect(land.isDisputed).to.be.false;
  });

  it("Should support batch import of real cadastral land records", async function () {
    const khasras = ["101/A", "102/B"];
    const locations = ["Naini, Prayagraj", "Civil Lines, Prayagraj"];
    const areas = [1200, 2400];
    const prices = [ethers.parseEther("0.8"), ethers.parseEther("1.6")];
    const ipfs = ["Qm101", "Qm102"];
    const owners = [citizenSeller.address, citizenBuyer.address];
    const verified = [true, true];
    const forSale = [true, false];
    const dispute = [false, false];

    await expect(
      landRegistry.batchImportLands(khasras, locations, areas, prices, ipfs, owners, verified, forSale, dispute)
    ).to.emit(landRegistry, "BatchLandsImported").withArgs(2);

    expect(await landRegistry.landCount()).to.equal(2);
    const land1 = await landRegistry.getLand(1);
    expect(land1.khasraNumber).to.equal("101/A");
    expect(land1.isVerified).to.be.true;
    expect(land1.isForSale).to.be.true;
  });
});
