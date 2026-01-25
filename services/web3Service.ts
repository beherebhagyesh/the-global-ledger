
import { NFTMetadata } from "../types";

// Basic interface for window.ethereum interaction
interface EthereumProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, handler: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export const connectWallet = async (): Promise<string | null> => {
  if (!window.ethereum) {
    throw new Error("No crypto wallet found. Please install Metamask or Rabby.");
  }

  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    return accounts[0] || null;
  } catch (error: any) {
    console.error("Wallet connect error:", error);
    throw new Error(error.message || "Failed to connect wallet");
  }
};

export const signMessage = async (address: string, message: string): Promise<string> => {
    if (!window.ethereum) throw new Error("No wallet");
    
    try {
        // Standard personal_sign
        const signature = await window.ethereum.request({
            method: 'personal_sign',
            params: [message, address]
        });
        return signature;
    } catch (error: any) {
        throw new Error("User rejected signature");
    }
}

export const generateMetadata = (player: any): NFTMetadata => {
    // Logic to create the JSON blob for the NFT
    return {
        name: `Global Architect: ${player.name}`,
        description: `Certified completion of The Global Ledger financial simulation. Net Worth: $${player.bankBalance}.`,
        image: "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi", // Placeholder Generic Badge
        attributes: [
            { trait_type: "Net Worth", value: player.bankBalance },
            { trait_type: "Reputation", value: player.reputation },
            { trait_type: "Class", value: player.characterClass },
            { trait_type: "Difficulty", value: player.mentorPersona },
            { trait_type: "Achievements", value: player.achievements.length }
        ]
    };
};

// Educational: returns the solidity code for the contract
export const getSmartContractCode = () => `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GlobalLedgerCredential is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    constructor(address initialOwner) ERC721("Global Ledger Architect", "GLARCH") Ownable(initialOwner) {}

    function safeMint(address to, string memory uri) public onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }
}
`;
