# Discovery & Reputation Protocol v1 - Specification

This document specifies the core mechanics for the Discovery & Reputation Marketplace, a critical infrastructure layer designed to decentralize message discovery and gateway trust within the SovereignComm network.

---

## 1. Core Philosophy

The protocol is designed to solve two fundamental problems in a decentralized network:

1.  **Efficient Discovery:** How can a client find its latest messages without scanning the entire blockchain, which is slow and expensive?
2.  **Trustless Selection:** How can a client choose a reliable and honest gateway to send messages through, without relying on a hardcoded, centralized list?

The solution is to create an open and competitive marketplace for specialized nodes, called **Discovery & Reputation Services (DRS)**, that provide this "intelligence layer" to the network. This prevents any single service from becoming a central point of failure or control.

---

## 2. Actors

*   **Client:** An end-user of the SovereignComm application. The client is a *consumer* of discovery and reputation data.
*   **Gateway Operator:** An entity that processes and anchors messages. Gateways are the subject of reputation scores.
*   **Discovery & Reputation Service (DRS) Operator:** An entity running a specialized node that provides indexing and reputation data as a paid service. They are the *producers* of data in this marketplace.

---

## 3. Core Components & Data Flow

A DRS node performs two synergistic roles:

### 3.1. On-Chain Indexing (The "Discovery" Role)

*   **Action:** The DRS node continuously monitors the anchoring blockchain (e.g., Stacks or Bitcoin L1). It specifically listens for transactions that update a user's `mailbox_root_cid`.
*   **Data Stored:** The DRS maintains a simple key-value database: `Map<user_address, latest_mailbox_root_cid>`.
*   **Purpose:** This creates a fast, off-chain index of the latest state for every user. When a client wants to check for new messages, it can query this index instead of performing a slow, expensive on-chain scan.

### 3.2. Off-Chain Aggregation (The "Reputation" Role)

*   **Action:** The DRS node listens to the off-chain gossip network for cryptographically signed "Vouches".
*   **What is a "Vouch"?** A Vouch is a small, signed piece of data a **client** creates after interacting with a **gateway**. It contains:
    *   `gateway_id`: The ID of the gateway being reviewed.
    *   `outcome`: `success` or `failure`.
    *   `latency_ms`: Measured time for the operation.
    *   `client_signature`: The client's signature, proving authenticity.
*   **Data Stored:** The DRS collects thousands of these vouches and aggregates them to calculate a real-time reputation score for each gateway. The scoring algorithm could consider:
    *   Success/failure ratio.
    *   Average latency.
    *   Age of vouches (newer ones have more weight).
    *   Number of unique clients vouching (to mitigate Sybil attacks).
*   **Purpose:** This creates a dynamic and trust-minimized "Yelp for Gateways", allowing clients to make informed decisions based on the recent experiences of the entire network.

---

## 4. The Marketplace Mechanism

1.  **Service Advertisement:** DRS operators advertise their service on the network. This advertisement is a signed message containing:
    *   `service_endpoint_url`: The API URL for their service.
    *   `price_per_query_sats`: The cost in satoshis for a single query.
    *   `operator_signature`: Proof of ownership.

2.  **Client Configuration & Selection:**
    *   A client application can come pre-configured with a list of well-known, reputable DRS nodes.
    *   The user has the ultimate freedom to add, remove, or choose their preferred DRS provider in the application settings, allowing them to switch for better performance, lower cost, or censorship resistance.

3.  **The Unified Query:** The client makes a single, efficient API call to its chosen DRS.
    *   **Request:** `GET /v1/network-state?user_address=<client_address>`
    *   **Response:** A JSON object containing:
        ```json
        {
          "mailbox": {
            "latest_cid": "bafy...user_mailbox_cid"
          },
          "gateways": [
            {
              "id": "gateway_A_id",
              "reputation_score": 0.98,
              "avg_latency_ms": 150,
              "price_per_kb_sats": 10
            },
            {
              "id": "gateway_B_id",
              "reputation_score": 0.95,
              "avg_latency_ms": 300,
              "price_per_kb_sats": 8
            }
          ]
        }
        ```

4.  **Client Action:** With this single response, the client has everything it needs:
    *   It knows where to start traversing the IPFS graph to find its messages (`latest_cid`).
    *   It has a scored and sorted list of gateways to choose from for sending its next message.

---

## 5. Economic Model

*   **Payment:** Clients pay the DRS operator for each query. This could be done via micropayments (Lightning) per query or through a pre-paid subscription model (e.g., 1000 queries for 500 sats).
*   **Incentive:** This creates a direct economic incentive for individuals and companies to run high-performance, reliable DRS nodes. Competition will naturally drive prices down and quality up.

This model effectively outsources the "heavy lifting" of network monitoring to a competitive market, keeping the client application lightweight and ensuring the entire ecosystem remains decentralized and resilient.