-- Create the 'messages' table
CREATE TABLE public.messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Unique identifier for the message, could be content_cid or a generated UUID

    sender_address text NOT NULL,
    -- The blockchain address of the sender

    recipient_address text NOT NULL,
    -- The blockchain address of the recipient

    content_cid text NOT NULL,
    -- The IPFS CID of the message content (encrypted or public)

    encrypted boolean NOT NULL DEFAULT FALSE,
    -- True if the message content is encrypted

    network text NOT NULL,
    -- The blockchain network where the message was anchored (e.g., 'bitcoin', 'ethereum')

    tx_hash text,
    -- The transaction hash on the blockchain where the message's Merkle Root was anchored

    merkle_proof_cid text,
    -- The IPFS CID of the Merkle Proof for this specific message within its batch

    created_at timestamp with time zone DEFAULT now() NOT NULL
    -- Timestamp of when the message was indexed
);

-- Create the 'indexer_state' table
CREATE TABLE public.indexer_state (
    id text PRIMARY KEY DEFAULT 'bitcoin_testnet_last_block',
    last_block_scanned bigint NOT NULL DEFAULT 0
);