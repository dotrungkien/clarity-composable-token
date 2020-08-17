;; Composable Non Fungible Token
(define-non-fungible-token composable-nft uint)


;; Storage

(define-map token-spender ((token-id uint)) ((spender principal)))

(define-map token-count ((owner principal)) ((count uint)))

(define-map account-operator ((operator principal) (account principal)) ((is-approved bool)))

(define-private (balance-of (account principal))
  (default-to u0
    (get count
      (map-get? token-count ((owner account)))
    )
  )
)

(define-public (owner-of? (token-id uint))
  (ok (nft-get-owner? composable-nft token-id))
)

(define-private (is-spender-approved (spender principal) (token-id uint))
  (let
    ((approve-spender
        (unwrap!
          (get spender
            (map-get? token-spender ((token-id token-id))))
          false
        )
    ))
    (is-eq spender approve-spender)
  )
)


(define-private (is-operator-approved (operator principal) (account principal))
  (unwrap!
    (get is-approved
      (map-get? account-operator ((operator operator) (account account)))
    )
    false
  )
)

(define-private (is-owner (actor principal) (token-id uint))
  (is-eq
    (unwrap! (nft-get-owner? composable-nft token-id) false)
    actor
  )
)