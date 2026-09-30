// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract TenderAllocation {
    struct BidCommitment {
        bytes32 commitmentHash;
        uint256 submissionTime;
        bool revealed;
        uint256 revealedAmount;
        string salt;
    }

    struct TenderRecord {
        string tenderId;
        address winner;
        string ipfsAuditCid;
        bool allocated;
        uint256 allocatedAt;
    }

    // tenderId => bidderAddress => BidCommitment
    mapping(string => mapping(address => BidCommitment)) public commitments;
    // tenderId => TenderRecord
    mapping(string => TenderRecord) public tenderRecords;
    
    address public owner;

    event BidSubmitted(string indexed tenderId, address indexed bidder, bytes32 commitmentHash);
    event BidRevealed(string indexed tenderId, address indexed bidder, uint256 amount);
    event WinnerAllocated(string indexed tenderId, address indexed winner, string ipfsAuditCid);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can execute this action");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Submit a sealed bid commitment hash: keccak256(abi.encodePacked(bidAmount, bidderAddress, salt))
     */
    function submitBid(string memory tenderId, bytes32 commitmentHash) external {
        require(commitmentHash != bytes32(0), "Invalid commitment hash");
        
        commitments[tenderId][msg.sender] = BidCommitment({
            commitmentHash: commitmentHash,
            submissionTime: block.timestamp,
            revealed: false,
            revealedAmount: 0,
            salt: ""
        });

        emit BidSubmitted(tenderId, msg.sender, commitmentHash);
    }

    /**
     * @notice Reveal bid amount and salt to verify on-chain integrity
     */
    function revealBid(string memory tenderId, uint256 amount, string memory salt) external returns (bool) {
        BidCommitment storage bid = commitments[tenderId][msg.sender];
        require(bid.commitmentHash != bytes32(0), "No commitment found for bidder");
        require(!bid.revealed, "Bid has already been revealed");

        bytes32 computedHash = keccak256(abi.encodePacked(amount, msg.sender, salt));
        require(computedHash == bid.commitmentHash, "Commitment hash verification failed");

        bid.revealed = true;
        bid.revealedAmount = amount;
        bid.salt = salt;

        emit BidRevealed(tenderId, msg.sender, amount);
        return true;
    }

    /**
     * @notice Finalize tender allocation with winner address and audit log IPFS CID
     */
    function allocateWinner(string memory tenderId, address winner, string memory ipfsAuditCid) external onlyOwner {
        require(!tenderRecords[tenderId].allocated, "Tender already allocated");

        tenderRecords[tenderId] = TenderRecord({
            tenderId: tenderId,
            winner: winner,
            ipfsAuditCid: ipfsAuditCid,
            allocated: true,
            allocatedAt: block.timestamp
        });

        emit WinnerAllocated(tenderId, winner, ipfsAuditCid);
    }

    /**
     * @notice View stored tender allocation record
     */
    function getTenderRecord(string memory tenderId) external view returns (TenderRecord memory) {
        return tenderRecords[tenderId];
    }
}
