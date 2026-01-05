// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IInvoiceNFT {
    enum InvoiceStatus {
        CREATED,
        BUYER_VERIFIED,
        LISTED,
        FUNDED,
        SETTLED,
        DEFAULTED
    }
    
    struct Invoice {
        string invoiceId;
        uint256 amount;
        uint256 dueDate;
        address seller;
        address buyer;
        string ipfsHash;
        bytes32 trustHash;
        bytes32 verificationHash;
        InvoiceStatus status;
        uint256 fundedAmount;
        address investor;
        uint256 createdAt;
    }
    
    function getInvoice(uint256 tokenId) external view returns (Invoice memory);
    function markFunded(uint256 tokenId, address investor, uint256 fundedAmount) external;
    function markSettled(uint256 tokenId) external;
    function markDefaulted(uint256 tokenId) external;
}

/**
 * @title Escrow
 * @dev Handles fund locking, release, and settlement for invoice financing
 */
contract Escrow is Ownable, ReentrancyGuard {
    
    IInvoiceNFT public invoiceNFT;
    
    // Yield rate in basis points (e.g., 500 = 5%)
    uint256 public baseYieldRate = 500;
    
    // Grace period after due date (in seconds)
    uint256 public gracePeriod = 7 days;
    
    // Late penalty rate in basis points per day
    uint256 public latePenaltyRate = 50;
    
    struct FundingDetails {
        uint256 tokenId;
        address investor;
        uint256 principal;
        uint256 expectedYield;
        uint256 fundedAt;
        bool settled;
    }
    
    // Mapping from tokenId to funding details
    mapping(uint256 => FundingDetails) public fundings;
    
    // Events
    event InvoiceFunded(uint256 indexed tokenId, address indexed investor, uint256 amount, uint256 expectedYield);
    event FundsReleasedToSeller(uint256 indexed tokenId, address indexed seller, uint256 amount);
    event InvoiceSettled(uint256 indexed tokenId, address indexed investor, uint256 principal, uint256 yield);
    event LatePaymentSettled(uint256 indexed tokenId, uint256 penalty);
    event InvoiceDefaulted(uint256 indexed tokenId);
    
    constructor(address _invoiceNFT) Ownable(msg.sender) {
        invoiceNFT = IInvoiceNFT(_invoiceNFT);
    }
    
    /**
     * @dev Fund an invoice - investor sends ETH to this contract
     */
    function fundInvoice(uint256 tokenId) external payable nonReentrant {
        IInvoiceNFT.Invoice memory invoice = invoiceNFT.getInvoice(tokenId);
        
        require(invoice.status == IInvoiceNFT.InvoiceStatus.LISTED, "Invoice not listed");
        require(msg.value >= invoice.amount, "Insufficient funds");
        require(fundings[tokenId].investor == address(0), "Already funded");
        
        // Calculate expected yield based on trust score and duration
        uint256 expectedYield = calculateYield(invoice.amount, invoice.dueDate);
        
        fundings[tokenId] = FundingDetails({
            tokenId: tokenId,
            investor: msg.sender,
            principal: msg.value,
            expectedYield: expectedYield,
            fundedAt: block.timestamp,
            settled: false
        });
        
        // Update NFT status
        invoiceNFT.markFunded(tokenId, msg.sender, msg.value);
        
        // Release funds to seller immediately
        (bool sent, ) = payable(invoice.seller).call{value: msg.value}("");
        require(sent, "Failed to send funds to seller");
        
        emit InvoiceFunded(tokenId, msg.sender, msg.value, expectedYield);
        emit FundsReleasedToSeller(tokenId, invoice.seller, msg.value);
    }
    
    /**
     * @dev Buyer pays the invoice on due date
     */
    function settleInvoice(uint256 tokenId) external payable nonReentrant {
        IInvoiceNFT.Invoice memory invoice = invoiceNFT.getInvoice(tokenId);
        FundingDetails storage funding = fundings[tokenId];
        
        require(invoice.status == IInvoiceNFT.InvoiceStatus.FUNDED, "Invoice not funded");
        require(msg.sender == invoice.buyer, "Only buyer can settle");
        require(!funding.settled, "Already settled");
        
        uint256 totalDue = funding.principal + funding.expectedYield;
        uint256 latePenalty = 0;
        
        // Check for late payment
        if (block.timestamp > invoice.dueDate) {
            uint256 daysLate = (block.timestamp - invoice.dueDate) / 1 days;
            latePenalty = (funding.principal * latePenaltyRate * daysLate) / 10000;
            totalDue += latePenalty;
        }
        
        require(msg.value >= totalDue, "Insufficient payment");
        
        funding.settled = true;
        
        // Pay investor
        (bool sent, ) = payable(funding.investor).call{value: msg.value}("");
        require(sent, "Failed to pay investor");
        
        // Update NFT status
        invoiceNFT.markSettled(tokenId);
        
        emit InvoiceSettled(tokenId, funding.investor, funding.principal, funding.expectedYield);
        
        if (latePenalty > 0) {
            emit LatePaymentSettled(tokenId, latePenalty);
        }
    }
    
    /**
     * @dev Mark invoice as defaulted (after grace period)
     */
    function markDefault(uint256 tokenId) external onlyOwner {
        IInvoiceNFT.Invoice memory invoice = invoiceNFT.getInvoice(tokenId);
        FundingDetails storage funding = fundings[tokenId];
        
        require(invoice.status == IInvoiceNFT.InvoiceStatus.FUNDED, "Invoice not funded");
        require(!funding.settled, "Already settled");
        require(block.timestamp > invoice.dueDate + gracePeriod, "Grace period not over");
        
        invoiceNFT.markDefaulted(tokenId);
        
        emit InvoiceDefaulted(tokenId);
    }
    
    /**
     * @dev Calculate yield based on amount and duration
     */
    function calculateYield(uint256 amount, uint256 dueDate) public view returns (uint256) {
        uint256 duration = dueDate - block.timestamp;
        uint256 daysUntilDue = duration / 1 days;
        
        // Simple yield: baseRate * (days / 30)
        return (amount * baseYieldRate * daysUntilDue) / (10000 * 30);
    }
    
    /**
     * @dev Get funding details
     */
    function getFunding(uint256 tokenId) external view returns (FundingDetails memory) {
        return fundings[tokenId];
    }
    
    /**
     * @dev Update yield rate (owner only)
     */
    function setYieldRate(uint256 newRate) external onlyOwner {
        baseYieldRate = newRate;
    }
    
    /**
     * @dev Update grace period (owner only)
     */
    function setGracePeriod(uint256 newPeriod) external onlyOwner {
        gracePeriod = newPeriod;
    }
}
