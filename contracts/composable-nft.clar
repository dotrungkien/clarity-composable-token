;; Composable Non Fungible Token
(define-non-fungible-token composable-token uint)

;; Storage
(define-map token-spender ((token-id uint)) ((spender principal)))
(define-map token-count ((owner principal)) ((count uint)))
(define-map account-operator ((operator principal) (account principal)) ((is-approved bool)))

;; Constant
(define-constant same-spender-err (err u1))
(define-constant not-approved-spender-err (err u2))
(define-constant failed-to-move-token-err (err u3))
(define-constant unauthorized-transfer-err (err u4))
(define-constant failed-to-mint-err (err u5))

(define-private (balance-of (account principal))
  (default-to u0
    (get count
      (map-get? token-count ((owner account)))
    )
  )
)

(define-public (owner-of? (token-id uint))
  (ok (nft-get-owner? composable-token token-id))
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
    (unwrap! (nft-get-owner? composable-token token-id) false)
    actor
  )
)

(define-private (can-transfer (actor principal) (token-id uint))
  (or
    (is-owner actor token-id)
    (is-spender-approved actor token-id)
    (is-operator-approved
      actor
      (unwrap! (nft-get-owner? composable-token token-id) false)
    )
  )
)

(define-private (register-token (new-owner principal) (token-id uint))
  (let
    ((current-balance (balance-of new-owner)))
    (begin
      (nft-mint? composable-token token-id new-owner)
      (map-set token-count
        ((owner new-owner))
        ((count (+ u1 current-balance)))
      )
      true
    )
  )
)

(define-private (release-token (owner principal) (token-id uint))
  (let
    ((current-balance (balance-of owner)))
    (begin
      (map-delete token-spender ((token-id token-id)))
      (map-set token-count
        ((owner owner))
        ((count (- current-balance u1)))
      )
      true
    )
  )
)

(define-public (set-spender-approval (spender principal) (token-id uint))
  (if (is-eq spender tx-sender)
    same-spender-err
    (if
      (or
        (is-owner tx-sender token-id)
        (is-operator-approved
          tx-sender
          (unwrap! (nft-get-owner? composable-token token-id) not-approved-spender-err)
        )
      )
      (begin
        (map-set token-spender
          ((token-id token-id))
          ((spender spender))
        )
        (ok token-id)
      )
      not-approved-spender-err
    )
  )
)

(define-public (set-operator-approval (operator principal) (is-approved bool))
  (if (is-eq operator tx-sender)
    same-spender-err
    (begin
      (map-set account-operator
        ((operator operator) (account tx-sender))
        ((is-approved is-approved))
      )
      (ok true)
    )
  )
)



(define-public (transfer-from (owner principal) (recipient principal) (token-id uint))
  (if
    (and
      (can-transfer tx-sender token-id)
      (is-owner owner token-id)
      (not (is-eq owner recipient))
    )
    (if
      (and
        (unwrap-panic (nft-transfer? composable-token token-id owner recipient))
        (map-set token-count
          ((owner owner))
          ((count (- (balance-of owner) u1)))
        )
        (map-set token-count
          ((owner recipient))
          ((count (+ (balance-of recipient) u1)))
        )
      )
      (ok token-id)
      failed-to-move-token-err
    )
    unauthorized-transfer-err
  )
)

(define-public (transfer (recipient principal) (token-id uint))
  (transfer-from tx-sender recipient token-id)
)

(define-private (mint! (owner principal) (token-id uint))
  (if (register-token owner token-id)
    (ok token-id)
    failed-to-mint-err
  )
)






















