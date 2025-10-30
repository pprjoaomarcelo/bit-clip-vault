# Staking Protocol - Economic Parameters v1

This document proposes the initial economic parameters for the Staking & Slashing Protocol. These values are designed to balance security, accessibility, and network responsiveness. They should be considered starting points, subject to refinement based on testnet data and community governance.

---

## 1. Capital & Penalties

### 1.1. `MINIMUM_STAKE`

*   **Proposed Value:** `0.01 BTC` (or its equivalent in a wrapped asset like wBTC on Stacks).
*   **Rationale:**
    *   **Deterrence:** The stake must be significantly more valuable than any potential profit from defrauding a single user or a small batch of users. At current prices, `0.01 BTC` represents a substantial amount of capital, making it economically irrational to risk losing it for a few thousand satoshis in service fees.
    *   **Barrier to Entry:** The value should not be so high that it prevents smaller, honest operators from joining the network. `0.01 BTC` is a serious commitment but remains attainable for dedicated participants, preventing centralization around a few wealthy operators.
    *   **Sybil Resistance:** A non-trivial stake makes it expensive for a malicious actor to create hundreds of "sock puppet" gateways to disrupt the network or manipulate reputation scores.

### 1.2. `SLASH_PERCENTAGE`

*   **Proposed Value:** `50%` of the gateway's current stake.
*   **Rationale:**
    *   **Significant Punishment:** A 50% slash is a devastating financial penalty, acting as a powerful deterrent. It immediately removes any profit from cheating and imposes a heavy loss.
    *   **Chance for Redemption:** It is not a 100% slash. This leaves the door open for an operator who made an honest mistake (e.g., server failure, misconfiguration) to correct their setup, add more capital to meet the `MINIMUM_STAKE` again, and rebuild their reputation. A 100% slash would be a "death penalty" with no chance of recovery.
    *   **Client Compensation:** The slashed funds are crucial for compensating the affected client. The protocol should ensure the client is refunded their original service fee from the slashed amount.

### 1.3. Slashed Funds Distribution

*   **Proposed Model:**
    1.  **Client Refund:** The first priority is to make the client whole. The amount the client paid for the service is returned to them from the slashed funds.
    2.  **Protocol Treasury:** The remainder of the slashed funds are sent to a community-governed treasury.
*   **Rationale:**
    *   **Incentivizing Challenges:** Refunding the client ensures they have a direct financial incentive to report malicious behavior.
    *   **Community Benefit:** Sending the rest to a treasury (instead of burning it) allows the community to use these funds to further develop the ecosystem, fund public goods, or provide grants.

---

## 2. Time-Based Parameters

These parameters are critical for the security and fairness of the dispute resolution process.

### 2.1. `UNSTAKE_TIMELOCK_PERIOD`

*   **Proposed Value:** `7 days` (1008 Bitcoin blocks, approx.)
*   **Rationale:** This is the "cooling-off" period after a gateway signals their intent to unstake. It must be long enough for any client who recently used the gateway's services to notice a failure and submit a challenge. 7 days provides a sufficient window for users, who may not check the app daily, to react before the gateway's capital is released.

### 2.2. `CHALLENGE_WINDOW`

*   **Proposed Value:** `24 hours` (144 Bitcoin blocks, approx.)
*   **Rationale:** This is the window a client has to initiate a `challenge()` after a service request. 24 hours is a reasonable balance. It's short enough that a gateway isn't exposed to indefinite liability for old transactions, but long enough for a client to realize their message wasn't anchored and take action.

### 2.3. `RESPONSE_WINDOW`

*   **Proposed Value:** `12 hours` (72 Bitcoin blocks, approx.)
*   **Rationale:** This is the window a gateway has to respond to a `challenge()` by providing their "Proof of Anchoring". 12 hours is ample time for an automated system or an attentive operator to respond to a dispute. A shorter window ensures that disputes are resolved quickly and clients are not left in limbo.

---

## 3. Future Governance

All of these parameters should be implemented as configurable variables within the staking smart contract. In the future, they should be governable by a decentralized process (e.g., a DAO vote), allowing the community to adjust the economic model as the network matures and the value of the underlying assets fluctuates.