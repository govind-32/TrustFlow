// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TrustRegistry
 * @dev On-chain storage for trust hashes and verification proofs
 */
contract TrustRegistry is Ownable {
    
    // Mapping from invoiceId to trust hash
    mapping(string => bytes32) public trustHashes;
    
    // Mapping from invoiceId to verification hash (wallet or web-based)
    mapping(string => bytes32) public verificationHashes;
    
    // Mapping from invoiceId to verification type
    mapping(string => VerificationType) public verificationTypes;
    
    enum VerificationType {
        NONE,
        WALLET_SIGNATURE,
        WEB_CONFIRMATION
    }
    
    // Events
    event TrustHashCommitted(string indexed invoiceId, bytes32 trustHash, uint256 timestamp);
    event VerificationCommitted(string indexed invoiceId, bytes32 verificationHash, VerificationType verificationType);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Commit trust hash for an invoice
     */
    function commitTrustHash(string memory invoiceId, bytes32 trustHash) external onlyOwner {
        require(trustHashes[invoiceId] == bytes32(0), "Trust hash already committed");
        
        trustHashes[invoiceId] = trustHash;
        
        emit TrustHashCommitted(invoiceId, trustHash, block.timestamp);
    }
    
    /**
     * @dev Commit verification via wallet signature
     */
    function commitWalletVerification(
        string memory invoiceId,
        bytes32 signatureHash
    ) external {
        require(verificationHashes[invoiceId] == bytes32(0), "Already verified");
        
        verificationHashes[invoiceId] = signatureHash;
        verificationTypes[invoiceId] = VerificationType.WALLET_SIGNATURE;
        
        emit VerificationCommitted(invoiceId, signatureHash, VerificationType.WALLET_SIGNATURE);
    }
    
    /**
     * @dev Commit verification via web confirmation (platform-attested)
     */
    function commitWebVerification(
        string memory invoiceId,
        bytes32 confirmationHash
    ) external onlyOwner {
        require(verificationHashes[invoiceId] == bytes32(0), "Already verified");
        
        verificationHashes[invoiceId] = confirmationHash;
        verificationTypes[invoiceId] = VerificationType.WEB_CONFIRMATION;
        
        emit VerificationCommitted(invoiceId, confirmationHash, VerificationType.WEB_CONFIRMATION);
    }
    
    /**
     * @dev Get trust hash for an invoice
     */
    function getTrustHash(string memory invoiceId) external view returns (bytes32) {
        return trustHashes[invoiceId];
    }
    
    /**
     * @dev Get verification details
     */
    function getVerification(string memory invoiceId) external view returns (bytes32, VerificationType) {
        return (verificationHashes[invoiceId], verificationTypes[invoiceId]);
    }
    
    /**
     * @dev Check if invoice is verified
     */
    function isVerified(string memory invoiceId) external view returns (bool) {
        return verificationHashes[invoiceId] != bytes32(0);
    }
}
