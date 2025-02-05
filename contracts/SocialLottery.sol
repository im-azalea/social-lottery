// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
}

contract SocialLottery {
    address public owner;
    IERC20 public socialToken;
    uint256 public constant ticketPrice = 500 * 1e18; // Asumsikan token memiliki 18 desimal
    uint256 public constant interval = 1 hours;
    
    address[] public participants;
    uint256 public lastDrawTime;

    event Joined(address indexed participant);
    event WinnerSelected(address indexed winner, uint256 prizeAmount);
    
    constructor(address _socialToken) {
        owner = msg.sender;
        socialToken = IERC20(_socialToken);
        lastDrawTime = block.timestamp;
    }
    
    function joinLottery() external {
        // Jika waktu sudah melewati interval dan ada peserta, lakukan draw terlebih dahulu
        if(block.timestamp >= lastDrawTime + interval && participants.length > 0) {
            drawWinner();
        }
        
        // Transfer token dari peserta ke kontrak
        require(socialToken.transferFrom(msg.sender, address(this), ticketPrice), "Token transfer failed");
        
        participants.push(msg.sender);
        emit Joined(msg.sender);
    }
    
    function drawWinner() public {
        require(block.timestamp >= lastDrawTime + interval, "Interval not reached");
        require(participants.length > 0, "No participants");
        
        // Generate indeks pseudo-random
        uint256 randomIndex = uint256(
            keccak256(abi.encodePacked(block.timestamp, block.difficulty, participants.length))
        ) % participants.length;
        address winner = participants[randomIndex];
        
        // Hitung total pot dan distribusi hadiah
        uint256 totalPot = participants.length * ticketPrice;
        uint256 winnerPrize = (totalPot * 95) / 100;
        uint256 ownerFee = totalPot - winnerPrize;
        
        // Transfer token ke pemenang dan owner
        require(socialToken.transfer(winner, winnerPrize), "Transfer to winner failed");
        require(socialToken.transfer(owner, ownerFee), "Transfer to owner failed");
        
        emit WinnerSelected(winner, winnerPrize);
        
        // Reset data untuk ronde berikutnya
        delete participants;
        lastDrawTime = block.timestamp;
    }
    
    // Fungsi view untuk mendapatkan daftar peserta
    function getParticipants() external view returns (address[] memory) {
        return participants;
    }
}
