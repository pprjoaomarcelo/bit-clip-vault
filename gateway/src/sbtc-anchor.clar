;; sbtc-anchor.clar
;; A simple contract to anchor data batches on Stacks.
;; This provides a scalable and cost-effective alternative to direct
;; Bitcoin OP_RETURN anchoring.

;; --- Constants & Errors ---
(define-constant ERR_NOT_AUTHORIZED (err u401))

;; --- Data Storage ---
;; We'll use a map to store the latest anchor for each gateway principal.
;; The key is the gateway's Stacks address (principal).
;; The value is a tuple containing the Merkle root and the IPFS CID of the index file.
(define-map gateway-anchors principal {
  merkle-root: (buff 32),
  index-cid: (string-ascii 64)
})

;; --- Public Functions ---

;; @desc Anchor a new batch of messages. Only the contract owner can do this initially.
;; @param merkle-root: The 32-byte Merkle root of the message CIDs batch.
;; @param index-cid: The IPFS CID of the index file containing Merkle proofs.
;; @returns (response bool)
(define-public (anchor-batch (merkle-root (buff 32)) (index-cid (string-ascii 64)))
  (begin
    ;; For now, anyone can call this. In a real scenario, we would add authorization checks.
    (map-set gateway-anchors tx-sender {
      merkle-root: merkle-root,
      index-cid: index-cid
    })
    (ok true)
  )
)

;; --- Read-Only Functions ---

;; @desc Retrieves the last anchor data for a given gateway principal.
;; @param gateway-principal: The Stacks address of the gateway to query.
;; @returns (optional {merkle-root: (buff 32), index-cid: (string-ascii 64)})
(define-read-only (get-last-anchor (gateway-principal principal))
  (map-get? gateway-anchors gateway-principal)
)