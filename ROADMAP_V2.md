# SovereignComm Roadmap 2.0: From Theory to a Robust Network

This document outlines the development phases for building the core infrastructure of the SovereignComm network, focusing on creating a resilient and economically sustainable system before full-scale feature development.

---

## Phase 1: Core Primitives - Design & Specification

**Objective:** To solve the hardest theoretical problems and create detailed specifications for the core economic and governance mechanics of the network.

*   **1.1. Gateway Governance & Staking Mechanism:**
    *   **Task:** Design the staking and slashing protocol to ensure gateway honesty.
    *   **Research:** Produce a comparative analysis of implementing the mechanism via:
        *   A) Smart Contracts on a capable platform (e.g., Stacks).
        *   B) Native Bitcoin capabilities (e.g., advanced multi-sig, CheckTemplateVerify, or other complex scripting).
    *   **Decision:** Produce a formal specification document for the chosen MVP approach.

*   **1.2. Gateway Economics & Marketplace:**
    *   **Task:** Specify the dynamic pricing algorithm for gateways (how message size, storage duration, and chain fees translate to a final price in sats).
    *   **Task:** Design the UI/UX for the client-side Gateway Marketplace. This includes displaying a list of available gateways with critical metadata: reputation score, network signal/latency, current price, and chosen anchoring chain.

*   **1.3. Protocol Reliability & Failure Handling:**
    *   **Task:** Define the end-to-end protocol for handling message delivery failures.
    *   **Specification:** Detail the client-facing error messages and the user's options, including an automated refund request or a one-click resend attempt via a different gateway.

*   **1.4. Message Retrieval & Mailbox Protocol:**
    *   **Task:** Formally specify the complete, end-to-end data flow for both sending and receiving a message.
    *   **Specification:** This document must explicitly detail:
        *   The IPLD data structures for the Mailbox, Inbox, and Message objects (including replies and attachments).
        *   The process of a sender's client instructing a gateway to update a recipient's mailbox.
        *   The process of a gateway batching multiple mailbox updates into a single Merkle Root.
        *   The flow for a gateway returning the Merkle Proof to the sender.
        *   The flow for a recipient's client discovering the mailbox update and using the IPLD graph to retrieve and decrypt the new message.

---

## Phase 2: Implementation - Client & Gateway Software

**Objective:** To write the code for the core primitives designed in Phase 1.

*   **2.1. Implement Gateway Governance:** Build the chosen staking/slashing mechanism (either the smart contract or the Bitcoin script-based system).
*   **2.2. Implement Marketplace:** Develop the gateway discovery UI in the client, including the logic to fetch, display, and select gateways based on the specified metadata.
*   **2.3. Implement Reliability Protocol:** Code the failure detection, error reporting, and refund/retry logic within the client.
*   **2.4. Implement Full Message Flow:** Add the Merkle Proof generation logic to the gateway software and the validation logic to the client software. Implement the full IPLD-based mailbox update and retrieval flow.

---

## Phase 3: Network Integration & Pre-Launch

**Objective:** To deploy, test, and secure the network in a real-world environment.

*   **3.1. Public Testnet Deployment:** Deploy the gateway software and client applications to a public testnet (e.g., Stacks testnet, a Bitcoin testnet).
*   **3.2. Economic Incentives Test:** Onboard test users and gateway operators to simulate the economic model and ensure incentives are correctly aligned.
*   **3.3. Security Audits:** Commission third-party security audits, focusing on the staking/slashing contracts and the cryptographic integrity of the message retrieval protocol.
*   **3.4. Community & Documentation:** Create comprehensive guides for end-users and aspiring gateway operators based on the testnet experience.
