import { useEffect, useState } from "react";
import { ethers } from "ethers";

// Ganti dengan alamat smart contract SocialLottery yang sudah dideploy
const lotteryAddress = "YOUR_DEPLOYED_LOTTERY_CONTRACT_ADDRESS";

// Alamat token $SOCIAL sudah ditentukan
const socialTokenAddress = "0x2ED49c7CfD45018a80651C0D5637a5D42a6948cb";

// ABI minimal untuk kontrak SocialLottery
const lotteryABI = [
  "function joinLottery() public",
  "function getParticipants() public view returns (address[])",
  "event WinnerSelected(address indexed winner, uint256 prizeAmount)",
];

// ABI minimal untuk ERC20
const erc20ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function allowance(address owner, address spender) public view returns (uint256)",
  "function decimals() public view returns (uint8)",
];

export default function Home() {
  const [walletAddress, setWalletAddress] = useState("");
  const [lastWinner, setLastWinner] = useState("");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [lotteryContract, setLotteryContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [joining, setJoining] = useState(false);

  // Fungsi untuk menyambungkan wallet
  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);
        setProvider(provider);
        setSigner(signer);
        // Inisialisasi kontrak
        const lottery = new ethers.Contract(lotteryAddress, lotteryABI, signer);
        setLotteryContract(lottery);
        const token = new ethers.Contract(socialTokenAddress, erc20ABI, signer);
        setTokenContract(token);
      } catch (error) {
        console.error("Wallet connection error:", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  // Fungsi untuk ikut undian
  const joinLottery = async () => {
    if (!lotteryContract || !tokenContract) {
      alert("Contracts not loaded");
      return;
    }
    setJoining(true);
    try {
      const ticketPrice = ethers.utils.parseUnits("500", 18); // Asumsi token 18 desimal
      // Cek allowance token
      const allowance = await tokenContract.allowance(walletAddress, lotteryAddress);
      if (allowance.lt(ticketPrice)) {
        const approveTx = await tokenContract.approve(lotteryAddress, ticketPrice);
        await approveTx.wait();
      }
      // Panggil fungsi joinLottery pada kontrak
      const tx = await lotteryContract.joinLottery();
      await tx.wait();
      alert("Successfully joined the lottery!");
    } catch (error) {
      console.error("Join error:", error);
      alert("Error joining lottery: " + error.message);
    }
    setJoining(false);
  };

  // Mendengarkan event WinnerSelected untuk menampilkan pemenang terakhir
  useEffect(() => {
    if (lotteryContract) {
      const filter = lotteryContract.filters.WinnerSelected();
      lotteryContract.on(filter, (winner, prizeAmount) => {
        setLastWinner(winner);
      });
      // Bersihkan listener ketika komponen unmount atau lotteryContract berubah
      return () => {
        lotteryContract.removeAllListeners(filter);
      };
    }
  }, [lotteryContract]);

  return (
    <div
      style={{
        backgroundColor: "black",
        color: "white",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        {/* Jika sudah ada logo kecil, masukkan file logo.png di folder public */}
        <img
          src="/logo.png"
          alt="Logo"
          style={{
            width: "50px",
            height: "50px",
            marginRight: "10px",
          }}
        />
        <h1>SOCIAL</h1>
      </header>
      <main style={{ textAlign: "center" }}>
        {!walletAddress ? (
          <button
            onClick={connectWallet}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Connect Wallet
          </button>
        ) : (
          <div>
            <p>Connected: {walletAddress}</p>
            <button
              onClick={joinLottery}
              disabled={joining}
              style={{
                padding: "10px 20px",
                fontSize: "16px",
                backgroundColor: "#add8e6", // Tombol berwarna biru muda
                border: "none",
                cursor: "pointer",
                marginTop: "20px",
              }}
            >
              {joining ? "Joining..." : "Join"}
            </button>
          </div>
        )}
        <div style={{ marginTop: "40px" }}>
          <h2>Last Winner:</h2>
          <p>{lastWinner || "No winner yet"}</p>
        </div>
      </main>
    </div>
  );
}
