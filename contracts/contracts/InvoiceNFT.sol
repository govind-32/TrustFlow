// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title InvoiceNFT
 * @dev ERC-721 contract for tokenizing invoices as NFTs
 */
contract InvoiceNFT is ERC721, ERC721URIStorage, Ownable {
    
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
    
    uint256 private _tokenIdCounter;
    
    // Mapping from token ID to Invoice
    mapping(uint256 => Invoice) public invoices;
    
    // Mapping from invoiceId string to token ID
    mapping(string => uint256) public invoiceIdToTokenId;
    
    // Events
    event InvoiceMinted(uint256 indexed tokenId, string invoiceId, address seller, uint256 amount);
    event InvoiceVerified(uint256 indexed tokenId, bytes32 verificationHash);
    event InvoiceListed(uint256 indexed tokenId);
    event InvoiceFunded(uint256 indexed tokenId, address investor, uint256 amount);
    event InvoiceSettled(uint256 indexed tokenId);
    event InvoiceDefaulted(uint256 indexed tokenId);
    
    constructor() ERC721("TrustFlow Invoice", "TFINV") Ownable(msg.sender) {}
    
    /**
     * @dev Mint a new invoice NFT
     */
    function mintInvoice(
        string memory invoiceId,
        uint256 amount,
        uint256 dueDate,
        address buyer,
        string memory ipfsHash,
        bytes32 trustHash
    ) external returns (uint256) {
        require(bytes(invoiceId).length > 0, "Invoice ID required");
        require(amount > 0, "Amount must be positive");
        require(dueDate > block.timestamp, "Due date must be future");
        require(invoiceIdToTokenId[invoiceId] == 0, "Invoice already exists");
        
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;
        
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, ipfsHash);
        
        invoices[tokenId] = Invoice({
            invoiceId: invoiceId,
            amount: amount,
            dueDate: dueDate,
            seller: msg.sender,
            buyer: buyer,
            ipfsHash: ipfsHash,
            trustHash: trustHash,
            verificationHash: bytes32(0),
            status: InvoiceStatus.CREATED,
            fundedAmount: 0,
            investor: address(0),
            createdAt: block.timestamp
        });
        
        invoiceIdToTokenId[invoiceId] = tokenId;
        
        emit InvoiceMinted(tokenId, invoiceId, msg.sender, amount);
        
        return tokenId;
    }
    
    /**
     * @dev Verify invoice with buyer signature or platform attestation
     */
    function verifyInvoice(uint256 tokenId, bytes32 verificationHash) external {
        Invoice storage invoice = invoices[tokenId];
        require(invoice.status == InvoiceStatus.CREATED, "Invalid status");
        require(
            msg.sender == invoice.buyer || msg.sender == owner(),
            "Only buyer or platform can verify"
        );
        
        invoice.verificationHash = verificationHash;
        invoice.status = InvoiceStatus.BUYER_VERIFIED;
        
        emit InvoiceVerified(tokenId, verificationHash);
    }
    
    /**
     * @dev List invoice for funding
     */
    function listForFunding(uint256 tokenId) external {
        Invoice storage invoice = invoices[tokenId];
        require(invoice.status == InvoiceStatus.BUYER_VERIFIED, "Must be verified first");
        require(msg.sender == invoice.seller, "Only seller can list");
        
        invoice.status = InvoiceStatus.LISTED;
        
        emit InvoiceListed(tokenId);
    }
    
    /**
     * @dev Mark invoice as funded (called by Escrow contract)
     */
    function markFunded(uint256 tokenId, address investor, uint256 fundedAmount) external onlyOwner {
        Invoice storage invoice = invoices[tokenId];
        require(invoice.status == InvoiceStatus.LISTED, "Must be listed");
        
        invoice.status = InvoiceStatus.FUNDED;
        invoice.investor = investor;
        invoice.fundedAmount = fundedAmount;
        
        emit InvoiceFunded(tokenId, investor, fundedAmount);
    }
    
    /**
     * @dev Mark invoice as settled (called by Escrow contract)
     */
    function markSettled(uint256 tokenId) external onlyOwner {
        Invoice storage invoice = invoices[tokenId];
        require(invoice.status == InvoiceStatus.FUNDED, "Must be funded");
        
        invoice.status = InvoiceStatus.SETTLED;
        
        emit InvoiceSettled(tokenId);
    }
    
    /**
     * @dev Mark invoice as defaulted
     */
    function markDefaulted(uint256 tokenId) external onlyOwner {
        Invoice storage invoice = invoices[tokenId];
        require(invoice.status == InvoiceStatus.FUNDED, "Must be funded");
        
        invoice.status = InvoiceStatus.DEFAULTED;
        
        emit InvoiceDefaulted(tokenId);
    }
    
    /**
     * @dev Get invoice details
     */
    function getInvoice(uint256 tokenId) external view returns (Invoice memory) {
        return invoices[tokenId];
    }
    
    /**
     * @dev Get invoice by invoiceId string
     */
    function getInvoiceByInvoiceId(string memory invoiceId) external view returns (Invoice memory) {
        uint256 tokenId = invoiceIdToTokenId[invoiceId];
        require(tokenId != 0, "Invoice not found");
        return invoices[tokenId];
    }
    
    // Required overrides
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
