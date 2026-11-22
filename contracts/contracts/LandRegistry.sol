// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LandRegistry
 * @dev Full-featured smart contract for decentralized land registration, verification,
 * dispute management, and escrow transactions.
 */
contract LandRegistry is AccessControl, ReentrancyGuard {
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");

    struct Land {
        uint256 id;
        string khasraNumber;
        string location; // Village, Tehsil, District
        uint256 area;     // In square meters (or scaled integer)
        uint256 price;    // In wei
        string ipfsHash;  // IPFS CID of land deed/records
        address payable currentOwner;
        bool isVerified;
        bool isForSale;
        bool isDisputed;
    }

    struct EscrowDeal {
        uint256 landId;
        address payable buyer;
        uint256 amount;
        bool isActive;
    }

    uint256 public landCount;
    mapping(uint256 => Land) public lands;
    mapping(uint256 => EscrowDeal) public escrowDeals;

    // Events
    event LandRegistered(
        uint256 indexed landId,
        string khasraNumber,
        address indexed owner,
        uint256 area,
        uint256 price,
        string ipfsHash
    );

    event LandVerified(
        uint256 indexed landId,
        bool approved,
        address indexed registrar
    );

    event ForSaleToggled(
        uint256 indexed landId,
        bool isForSale,
        uint256 price
    );

    event EscrowInitiated(
        uint256 indexed landId,
        address indexed buyer,
        uint256 amount
    );

    event EscrowApproved(
        uint256 indexed landId,
        address indexed seller,
        address indexed buyer,
        uint256 amount
    );

    event EscrowCancelled(
        uint256 indexed landId,
        address indexed buyer,
        uint256 amount
    );

    event OwnershipTransferred(
        uint256 indexed landId,
        address indexed previousOwner,
        address indexed newOwner,
        uint256 price
    );

    event DisputeUpdated(
        uint256 indexed landId,
        bool isDisputed,
        address indexed registrar
    );

    event BatchLandsImported(
        uint256 totalImported
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGISTRAR_ROLE, msg.sender);
    }

    /**
     * @notice Register a single land parcel (Called by citizen or surveyor)
     */
    function registerLand(
        string memory _khasraNumber,
        string memory _location,
        uint256 _area,
        uint256 _price,
        string memory _ipfsHash
    ) external returns (uint256) {
        require(bytes(_khasraNumber).length > 0, "Khasra number is required");
        require(_area > 0, "Area must be greater than zero");

        landCount++;
        lands[landCount] = Land({
            id: landCount,
            khasraNumber: _khasraNumber,
            location: _location,
            area: _area,
            price: _price,
            ipfsHash: _ipfsHash,
            currentOwner: payable(msg.sender),
            isVerified: false,
            isForSale: false,
            isDisputed: false
        });

        emit LandRegistered(
            landCount,
            _khasraNumber,
            msg.sender,
            _area,
            _price,
            _ipfsHash
        );

        return landCount;
    }

    /**
     * @notice Batch import land parcels (Admin tool for pre-existing cadastral records)
     */
    function batchImportLands(
        string[] memory _khasraNumbers,
        string[] memory _locations,
        uint256[] memory _areas,
        uint256[] memory _prices,
        string[] memory _ipfsHashes,
        address[] memory _owners,
        bool[] memory _verifiedStatuses,
        bool[] memory _forSaleStatuses,
        bool[] memory _disputeStatuses
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 len = _khasraNumbers.length;
        require(
            _locations.length == len &&
            _areas.length == len &&
            _prices.length == len &&
            _ipfsHashes.length == len &&
            _owners.length == len &&
            _verifiedStatuses.length == len &&
            _forSaleStatuses.length == len &&
            _disputeStatuses.length == len,
            "Array length mismatch"
        );

        for (uint256 i = 0; i < len; i++) {
            landCount++;
            lands[landCount] = Land({
                id: landCount,
                khasraNumber: _khasraNumbers[i],
                location: _locations[i],
                area: _areas[i],
                price: _prices[i],
                ipfsHash: _ipfsHashes[i],
                currentOwner: payable(_owners[i]),
                isVerified: _verifiedStatuses[i],
                isForSale: _forSaleStatuses[i],
                isDisputed: _disputeStatuses[i]
            });

            emit LandRegistered(
                landCount,
                _khasraNumbers[i],
                _owners[i],
                _areas[i],
                _prices[i],
                _ipfsHashes[i]
            );

            if (_verifiedStatuses[i]) {
                emit LandVerified(landCount, true, msg.sender);
            }
            if (_disputeStatuses[i]) {
                emit DisputeUpdated(landCount, true, msg.sender);
            }
        }

        emit BatchLandsImported(len);
    }

    /**
     * @notice Verify or reject a registered land parcel
     */
    function verifyLand(uint256 _landId, bool _approved) external onlyRole(REGISTRAR_ROLE) {
        require(_landId > 0 && _landId <= landCount, "Land parcel does not exist");
        Land storage land = lands[_landId];
        land.isVerified = _approved;

        emit LandVerified(_landId, _approved, msg.sender);
    }

    /**
     * @notice Toggle 'For Sale' status and set price
     */
    function toggleForSale(uint256 _landId, uint256 _price) external {
        require(_landId > 0 && _landId <= landCount, "Land parcel does not exist");
        Land storage land = lands[_landId];
        require(land.currentOwner == msg.sender, "Only current owner can list");
        require(land.isVerified, "Land must be verified before listing");
        require(!land.isDisputed, "Cannot list disputed land");
        require(!escrowDeals[_landId].isActive, "Active escrow deal in progress");

        land.isForSale = !land.isForSale;
        if (land.isForSale) {
            require(_price > 0, "Price must be greater than zero");
            land.price = _price;
        }

        emit ForSaleToggled(_landId, land.isForSale, land.price);
    }

    /**
     * @notice Buyer initiates escrow by depositing the full land price in ETH
     */
    function initiateEscrowBuy(uint256 _landId) external payable nonReentrant {
        require(_landId > 0 && _landId <= landCount, "Land parcel does not exist");
        Land storage land = lands[_landId];

        require(land.isVerified, "Land is not verified");
        require(land.isForSale, "Land is not listed for sale");
        require(!land.isDisputed, "Land is under dispute");
        require(msg.sender != land.currentOwner, "Owner cannot buy own property");
        require(msg.value == land.price, "Exact land price must be deposited");
        require(!escrowDeals[_landId].isActive, "Active escrow deal already exists");

        escrowDeals[_landId] = EscrowDeal({
            landId: _landId,
            buyer: payable(msg.sender),
            amount: msg.value,
            isActive: true
        });

        emit EscrowInitiated(_landId, msg.sender, msg.value);
    }

    /**
     * @notice Buyer initiates escrow by depositing 10% earnest money (or custom earnest deposit)
     */
    function initiateEarnestEscrow(uint256 _landId) external payable nonReentrant {
        require(_landId > 0 && _landId <= landCount, "Land parcel does not exist");
        Land storage land = lands[_landId];

        require(land.isVerified, "Land is not verified");
        require(land.isForSale, "Land is not listed for sale");
        require(!land.isDisputed, "Land is under dispute");
        require(msg.sender != land.currentOwner, "Owner cannot buy own property");
        uint256 minEarnest = land.price / 10;
        require(msg.value >= minEarnest, "Must deposit at least 10% earnest money");
        require(!escrowDeals[_landId].isActive, "Active escrow deal already exists");

        escrowDeals[_landId] = EscrowDeal({
            landId: _landId,
            buyer: payable(msg.sender),
            amount: msg.value,
            isActive: true
        });

        emit EscrowInitiated(_landId, msg.sender, msg.value);
    }

    /**
     * @notice Government Registrar approves deed registration and releases escrow funds
     */
    function approveOwnershipTransfer(uint256 _landId) external nonReentrant onlyRole(REGISTRAR_ROLE) {
        require(_landId > 0 && _landId <= landCount, "Land parcel does not exist");
        EscrowDeal storage deal = escrowDeals[_landId];
        require(deal.isActive, "No active escrow deal for this land");

        Land storage land = lands[_landId];
        require(!land.isDisputed, "Cannot finalize transfer: Land is disputed");

        address payable seller = land.currentOwner;
        address payable buyer = deal.buyer;
        uint256 amount = deal.amount;

        // Reset escrow deal state
        deal.isActive = false;

        // Update ownership and listing status
        land.currentOwner = buyer;
        land.isForSale = false;

        // Transfer funds to previous owner (seller)
        (bool sent, ) = seller.call{value: amount}("");
        require(sent, "Failed to disburse escrow funds to seller");

        emit EscrowApproved(_landId, seller, buyer, amount);
        emit OwnershipTransferred(_landId, seller, buyer, amount);
    }

    /**
     * @notice Cancel escrow deal and return funds to buyer
     */
    function cancelEscrow(uint256 _landId) external nonReentrant {
        require(_landId > 0 && _landId <= landCount, "Land parcel does not exist");
        EscrowDeal storage deal = escrowDeals[_landId];
        require(deal.isActive, "No active escrow deal");

        Land storage land = lands[_landId];
        require(
            msg.sender == deal.buyer ||
            msg.sender == land.currentOwner ||
            hasRole(REGISTRAR_ROLE, msg.sender),
            "Not authorized to cancel this escrow"
        );

        address payable buyer = deal.buyer;
        uint256 refundAmount = deal.amount;
        deal.isActive = false;

        (bool refunded, ) = buyer.call{value: refundAmount}("");
        require(refunded, "Refund transfer failed");

        emit EscrowCancelled(_landId, buyer, refundAmount);
    }

    /**
     * @notice Freeze or unfreeze a land parcel due to dispute or loan default
     */
    function setDisputeStatus(uint256 _landId, bool _status) external onlyRole(REGISTRAR_ROLE) {
        require(_landId > 0 && _landId <= landCount, "Land parcel does not exist");
        Land storage land = lands[_landId];
        land.isDisputed = _status;
        if (_status) {
            land.isForSale = false;
        }

        emit DisputeUpdated(_landId, _status, msg.sender);
    }

    // View functions
    function getLand(uint256 _landId) external view returns (Land memory) {
        require(_landId > 0 && _landId <= landCount, "Invalid land ID");
        return lands[_landId];
    }

    function getAllLands() external view returns (Land[] memory) {
        Land[] memory all = new Land[](landCount);
        for (uint256 i = 1; i <= landCount; i++) {
            all[i - 1] = lands[i];
        }
        return all;
    }

    function getEscrowDeal(uint256 _landId) external view returns (EscrowDeal memory) {
        return escrowDeals[_landId];
    }
}
