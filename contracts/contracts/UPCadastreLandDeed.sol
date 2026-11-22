// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title UPCadastreLandDeed
 * @dev Official Government of Uttar Pradesh Real World Asset (RWA) Land Title Deed NFT.
 * Issued and signed by authorized Sub-Registrar officers under the UP Revenue Code.
 * Enforces legal dispute freeze locks and stores on-chain cadastral particulars.
 */
contract UPCadastreLandDeed is ERC721URIStorage, AccessControl, ReentrancyGuard {
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");
    bytes32 public constant INSPECTOR_ROLE = keccak256("INSPECTOR_ROLE");

    struct DeedParams {
        address proprietor;
        uint256 landId;
        string khasraNumber;
        string district;
        string tehsil;
        string village;
        uint256 areaSqFt;
        uint256 declaredValue;
        string ipfsCID;
    }

    struct TitleDeedRecord {
        uint256 landId;
        string khasraNumber;
        string district;
        string tehsil;
        string village;
        uint256 areaSqFt;
        uint256 declaredValue;
        string ipfsDeedCID;
        address proprietor;
        bool isVerified;
        bool isDisputed;
        uint256 registeredAt;
        address verifiedByRegistrar;
    }

    // Mapping from tokenId (landId) to cadastral record
    mapping(uint256 => TitleDeedRecord) public deeds;

    // Legal injunction / dispute freeze mapping
    mapping(uint256 => bool) public isDisputed;

    // Total deeds minted counter
    uint256 public totalDeedsMinted;

    // Events
    event TitleDeedMinted(
        uint256 indexed landId,
        address indexed proprietor,
        string khasraNumber,
        string district,
        string ipfsCID,
        uint256 declaredValue,
        address indexed registrar
    );

    event DisputeStatusToggled(
        uint256 indexed landId,
        bool isFrozen,
        string reason,
        address indexed registrar
    );

    constructor() ERC721("UP Cadastre Land Title Deed", "UPLAND") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGISTRAR_ROLE, msg.sender);

        // Pre-authorize Chief Registrar demo officer wallet (Hardhat Account #1)
        _grantRole(REGISTRAR_ROLE, 0x70997970C51812dc3A010C7d01b50e0d17dc79C8);
        _grantRole(DEFAULT_ADMIN_ROLE, 0x70997970C51812dc3A010C7d01b50e0d17dc79C8);
    }

    /**
     * @notice Approves a pending application and mints an on-chain RWA Land Title Deed NFT
     */
    function verifyAndMintTitleDeed(
        DeedParams calldata p
    ) external onlyRole(REGISTRAR_ROLE) nonReentrant returns (uint256) {
        require(p.proprietor != address(0), "Invalid proprietor address");
        require(bytes(p.khasraNumber).length > 0, "Khasra number required");
        require(bytes(p.ipfsCID).length > 0, "IPFS deed CID required");

        _safeMint(p.proprietor, p.landId);

        string memory uri = string(abi.encodePacked("ipfs://", p.ipfsCID));
        _setTokenURI(p.landId, uri);

        deeds[p.landId] = TitleDeedRecord({
            landId: p.landId,
            khasraNumber: p.khasraNumber,
            district: p.district,
            tehsil: p.tehsil,
            village: p.village,
            areaSqFt: p.areaSqFt,
            declaredValue: p.declaredValue,
            ipfsDeedCID: p.ipfsCID,
            proprietor: p.proprietor,
            isVerified: true,
            isDisputed: false,
            registeredAt: block.timestamp,
            verifiedByRegistrar: msg.sender
        });

        totalDeedsMinted += 1;

        emit TitleDeedMinted(
            p.landId,
            p.proprietor,
            p.khasraNumber,
            p.district,
            p.ipfsCID,
            p.declaredValue,
            msg.sender
        );

        return p.landId;
    }

    /**
     * @notice Enforces legal court freeze or unlocks title after dispute settlement
     */
    function setDisputeFreeze(
        uint256 landId,
        bool isFrozen,
        string calldata reason
    ) external onlyRole(REGISTRAR_ROLE) {
        require(_ownerOf(landId) != address(0), "Land title deed does not exist");
        isDisputed[landId] = isFrozen;
        deeds[landId].isDisputed = isFrozen;

        emit DisputeStatusToggled(landId, isFrozen, reason, msg.sender);
    }

    /**
     * @notice Sub-Registrar approves verified escrow deed transfer to buyer
     */
    function executeEscrowTransfer(
        uint256 landId,
        address newProprietor
    ) external onlyRole(REGISTRAR_ROLE) nonReentrant {
        require(_ownerOf(landId) != address(0), "Title deed does not exist");
        require(!isDisputed[landId], "Transfer locked: Parcel is under dispute");
        require(newProprietor != address(0), "Invalid new proprietor address");

        address previousOwner = _ownerOf(landId);
        _transfer(previousOwner, newProprietor, landId);

        deeds[landId].proprietor = newProprietor;
    }

    /**
     * @notice Overridden transfer hook to prevent transfer of frozen or disputed parcels
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        if (to != address(0) && _ownerOf(tokenId) != address(0)) {
            require(!isDisputed[tokenId], "Transfer locked: Title deed is under legal dispute/injunction");
        }
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Resolves ERC165 interface conflict between ERC721URIStorage and AccessControl
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @notice Quick lookup for cadastral deed record
     */
    function getDeedRecord(uint256 landId) external view returns (TitleDeedRecord memory) {
        require(_ownerOf(landId) != address(0), "Title deed does not exist");
        return deeds[landId];
    }
}
