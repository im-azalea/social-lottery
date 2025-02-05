import { ethers } from "ethers";

// Alamat Smart Contract
const contractAddress = "0x2ED49c7CfD45018a80651C0D5637a5D42a6948cb"; 

// ABI Smart Contract
const contractABI = [
  // Fungsi untuk membeli tiket
  "function buyTicket() external payable",
  // Fungsi untuk mendapatkan daftar peserta
  "function getParticipants() external view returns (address[])",
  // Fungsi untuk mendapatkan pemenang terakhir
  "function lastWinner() external view returns (address)"
];

// Fungsi untuk mendapatkan instance contract
export const getContract = (provider) => {
  return new ethers.Contract(contractAddress, contractABI, provider);
};
