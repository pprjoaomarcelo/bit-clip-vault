import type { CID } from 'multiformats';

/**
 * Represents the root object for a user's mailbox, pointed to by the on-chain CID.
 * IPLD Level 1.
 */
export interface Mailbox {
  inbox: CID;  // Link to the MessageIndex for incoming messages
  sent: CID;   // Link to the MessageIndex for outgoing messages
}

/**
 * Represents an index of messages (either inbox or sent).
 * It's a map where keys are non-sequential, unique message IDs (e.g., UUIDs)
 * and values are CIDs pointing to the actual message content.
 * IPLD Level 2.
 */
export interface MessageIndex {
  [messageId: string]: CID;
}

/**
 * Represents the actual content of a message.
 * This would be the raw data (likely encrypted) that is stored in IPFS.
 * IPLD Level 3.
 */
export type Message = Uint8Array; // Messages are treated as raw binary data (encrypted)
