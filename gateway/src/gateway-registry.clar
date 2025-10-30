;; gateway-registry.clar
;; A decentralized, on-chain registry for SovereignComm gateways.
;; This allows gateways to register themselves and for indexers to discover them dynamically.

;; --- Constants & Errors ---
(define-constant ERR_GATEWAY_ALREADY_REGISTERED (err u101))
(define-constant ERR_REGISTRATION_FEE_TOO_LOW (err u102))

;; A small fee to prevent spamming the registry.
(define-constant REGISTRATION_FEE u1000000) ;; 1 STX

;; --- Data Storage ---

;; We use a map to store metadata about each gateway.
;; The key is the gateway's principal address.
;; The value is a tuple containing its self-declared name and API endpoint.
(define-map gateways principal {
  name: (string-ascii 64),
  api-url: (string-ascii 128)
})

;; --- Public Functions ---

;; @desc Called by a new gateway to add itself to the public registry.
;; @param name: A human-readable name for the gateway.
;; @param api-url: The public URL for the gateway's API (for Merkle proof lookups, etc.).
;; @returns (response bool)
(define-public (register (name (string-ascii 64)) (api-url (string-ascii 128)))
  (begin
    ;; For now, anyone can register. We could add more complex governance later.
    (asserts! (is-none (map-get? gateways tx-sender)) ERR_GATEWAY_ALREADY_REGISTERED)

    (map-set gateways tx-sender { name: name, api-url: api-url })
    (ok true)
  )
)

;; --- Read-Only Functions ---

;; @desc Returns the full map of registered gateways.
;; @returns (response (map principal {name: (string-ascii 64), api-url: (string-ascii 128)}))
(define-read-only (get-gateways)
  (ok gateways)
)