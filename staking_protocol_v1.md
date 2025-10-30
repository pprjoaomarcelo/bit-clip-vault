# Staking and Slashing Protocol v1 - Specification

This document specifies the core mechanics for the staking and slashing protocol, designed to ensure gateway honesty and network reliability.

---

## 1. Core Philosophy

The protocol is designed around a simple economic principle: **make cheating more expensive than being honest**. Gateway operators must lock up capital (a "stake") as a bond for good behavior. If they fail to provide the service they were paid for, this stake can be "slashed" (confiscated), compensating the user and penalizing the malicious operator.

---

## 2. Actors

There are two primary actors in this protocol:

*   **Gateway Operator:** An entity running the SovereignComm gateway software. To become an active and trusted participant in the network, the operator must stake a certain amount of capital. They are responsible for processing messages, anchoring them on-chain, and providing proof of service.

*   **Client:** An end-user of the SovereignComm application. The client pays a gateway for its services and has the right to challenge the gateway if the service is not rendered as agreed.

---

## 3. Core Actions (Functions)

The protocol is defined by a set of core actions that manage the lifecycle of a stake and handle disputes. These actions would likely be implemented as functions within a smart contract.

### 3.1. `stake()`

*   **Actor:** Gateway Operator
*   **Action:** A prospective gateway operator calls this function to deposit the required amount of capital (e.g., in BTC or a wrapped equivalent) into the protocol's contract.
*   **Pre-conditions:** The operator must send a value greater than or equal to the `MINIMUM_STAKE`.
*   **Post-conditions:**
    *   The operator's address is registered as an active gateway.
    *   Their stake is locked in the contract.
    *   They are now eligible to be listed in the Gateway Marketplace and accept service requests.

### 3.2. `unstake()`

*   **Actor:** Gateway Operator
*   **Action:** An active gateway operator calls this function to signal their intent to leave the network and withdraw their stake.
*   **Pre-conditions:** The operator must be an active staker.
*   **Post-conditions:**
    *   The operator's status is changed to "unstaking". They can no longer accept new service requests.
    *   A **timelock period** begins (e.g., 7 days). This is a crucial security measure to allow any pending challenges against the gateway to be submitted before the capital is released.
    *   After the timelock period expires without any successful challenges, the operator can call a `withdraw()` function to receive their stake back.

### 3.3. `challenge()`

*   **Actor:** Client
*   **Action:** A client who paid a gateway for a service but did not receive the "Proof of Anchoring" within a specified time window calls this function.
*   **Pre-conditions:**
    *   The client must provide cryptographic proof of payment (e.g., a paid Lightning invoice linked to a service request).
    *   The client must specify the gateway being challenged.
    *   The challenge must be submitted within a defined "challenge window" after the payment.
*   **Post-conditions:**
    *   A dispute is opened against the gateway.
    *   The gateway's stake is temporarily frozen, preventing withdrawal.
    *   The gateway now has a "response window" to submit their "Proof of Anchoring" to the contract to refute the challenge.

### 3.4. `slash()`

*   **Actor:** Protocol (can be called by anyone after a successful challenge)
*   **Action:** This function is executed if a gateway fails to respond to a `challenge` within the response window.
*   **Pre-conditions:** A challenge must be open and its response window must have expired.
*   **Post-conditions:**
    *   A portion of the gateway's stake is confiscated.
    *   A part of the confiscated amount is sent to the client who made the challenge, as compensation.
    *   The rest of the confiscated amount could be burned or sent to a community treasury.
    *   The gateway's reputation score is severely penalized.