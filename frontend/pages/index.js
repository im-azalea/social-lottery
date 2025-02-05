import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getContract } from "../utils/contract";

export default function Home() {
  const [participants, setParticipants] = useState([]);
  const [lastWinner, setLastWinner] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");

  useEffect(() => {
    if (window.ethereum) {
      loadContractData();
    }
  }, []);

  const loadContractData = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = getContract(provider);
    const participantsList = await contract.getParticipants();
    const winner = await contract.lastWinner();
    setParticipants(participantsList);
    setLastWinner(winner);
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setWalletAddress(accounts[0]);
      setIsConnected(true);
    } else {
      alert("MetaMask is required!");
    }
  };

  const buyTicket = async () => {
    if (!isConnected) {
      alert("Connect your wallet first!");
      return;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = getContract(signer);

    try {
      const tx = await contract.buyTicket({ value: ethers.utils.parseEther("500") });
      await tx.wait();
      alert("Ticket purchased successfully!");
      loadContractData(); 
    } catch (error) {
      alert("Transaction failed!");
      console.error(error);
    }
  };

  return (
    <div style={{ backgroundColor: "black", color: "white", minHeight: "100vh", textAlign: "center", padding: "20px" }}>
      <h1>Welcome to SOCIAL Lottery</h1>
      
      {!isConnected ? (
        <button onClick={connectWallet} style={{ backgroundColor: "blue", color: "white", padding: "10px", fontSize: "16px" }}>
          Connect Wallet
        </button>
      ) : (
        <>
          <p>Connected: {walletAddress}</p>
          <button onClick={buyTicket} style={{ backgroundColor: "lightblue", color: "black", padding: "10px", fontSize: "16px" }}>
            Join Lottery (500 $SOCIAL)
          </button>
        </>
      )}

      <h2>Participants:</h2>
      <ul>
        {participants.map((addr, index) => (
          <li key={index}>{addr}</li>
        ))}
      </ul>

      <h2>Last Winner:</h2>
      <p>{lastWinner || "No winner yet"}</p>
    </div>
  );
}
