# SovereignComm

SovereignComm is a visionary project to build a truly sovereign and resilient communication system. It combines the physical reach of LoRa mesh networks with the permanence and security of decentralized technologies like IPFS, Filecoin, and the Bitcoin blockchain.

## Core Architecture

The system is designed to anchor data from a potentially offline LoRa mesh network into a global, immutable database (the Bitcoin blockchain). The high-level workflow is as follows:

1.  A user sends a message over the LoRa mesh network.
2.  A gateway node, which has both LoRa and internet connectivity, picks up the message.
3.  The gateway uploads the message content to the InterPlanetary File System (IPFS), receiving a Content Identifier (CID).
4.  The gateway then commits this CID to the Bitcoin blockchain using an `OP_RETURN` transaction. This acts as an immutable pointer to the message data without bloating the blockchain itself.
5.  For long-term persistence, the data associated with the CID is pinned on Filecoin.

## Key Challenges

- **Mesh Scalability:** LoRa networks have low bandwidth and are subject to duty-cycle regulations.
- **Gateway Incentives:** Gateway operators need incentives to provide the crucial bridge between the LoRa network and the internet.
- **Key Management:** User identity is tied to their cryptographic keys, making key security and backup paramount.

## Proposed Solutions & Economic Model

- **On-chain Cost Optimization:** Instead of one Bitcoin transaction per message, gateways will batch multiple message CIDs into a Merkle Tree and record a single Merkle Root on-chain, reducing costs drastically.
- **Incentive Model:** Micropayments via the Lightning Network will be used to compensate gateway operators for their service, creating a sustainable and market-driven network.
- **Phased Rollout:** The project may start by using a lower-cost blockchain (like a Bitcoin sidechain or a Layer 2) to validate the model before moving to the Bitcoin mainnet for maximum security.

## Target Applications

- **Primary:** Providing communication for populations without internet access.
- **Secondary:**
    - Disaster relief communications.
    - Censorship-resistant communication for journalists and activists.
    - Secure and low-cost Machine-to-Machine (M2M) and IoT communication.

## Core Data Architecture: IPLD

To solve the challenge of retrieving individual messages while only storing a single root identifier on-chain, SovereignComm will use a structured data approach with IPFS's Inter-Planetary Linked Data (IPLD).

This architecture was chosen for its flexibility, privacy, and scalability over deterministic or Merkle-proof-based retrieval systems.

The structure is as follows:

1.  **On-Chain Anchor (Bitcoin):** A single `root_cid` is stored on the blockchain for each **identity address**, pointing to that identity's master "Mailbox" object. This is the single point of truth for that specific address (which can be a primary or a derived sub-account).

2.  **IPFS Level 1 (Mailbox Object):** The `root_cid` resolves to an IPLD object (a key-value map) that contains links to the user's inbox and sent items.
    ```json
    {
      "inbox":  { "/": "QmInboxCid..." },
      "sent":   { "/": "QmSentCid..." }
    }
    ```

3.  **IPFS Level 2 (Message Index Objects):** The `inbox` and `sent` CIDs point to other IPLD map objects. These objects act as indexes, mapping unique, non-sequential message IDs (e.g., UUIDs) to the CIDs of the actual message content. Using non-sequential IDs prevents metadata leakage about the number of messages a user has.
    ```json
    {
      "msg-uuid-001": { "/": "QmMsg1Cid..." },
      "msg-uuid-002": { "/": "QmMsg2Cid..." }
    }
    ```

4.  **IPFS Level 3 (Message Content):** The final CIDs point to the raw, encrypted message data.

This layered approach allows clients to efficiently traverse the data graph to find specific messages without downloading the entire dataset, while the blockchain provides the ultimate immutable reference to the user's data root.

---

## Maintenance

### Clearing Disk Space in Google Cloud Shell

The Google Cloud Shell environment has a limited home disk size (around 5 GB). During development, `npm` caches and `node_modules` directories can consume this space rapidly, leading to a "disk usage at 99%" error which can block all file operations.

If this occurs, follow these steps to clean up the environment:

1.  **Analyze Disk Usage:** First, identify the largest directories.
    ```bash
    du -sh /home/mrx_hck3r/* .[^.]* | sort -rh | head -n 10
    ```

2.  **Clear the NPM Cache:** The `.npm` cache is often the biggest culprit and is safe to clear.
    ```bash
    npm cache clean --force
    ```

3.  **Remove all `node_modules` Directories:** These can be regenerated.
    ```bash
    # Remove from project
    rm -rf /home/mrx_hck3r/sovereign-comm/node_modules

    # Remove from any other locations found in step 1
    rm -rf /home/mrx_hck3r/node_modules
    ```

4.  **Reinstall Project Dependencies:** After cleaning, navigate to the project directory and reinstall the necessary packages.
    ```bash
    cd /home/mrx_hck3r/sovereign-comm
    npm install
    ```