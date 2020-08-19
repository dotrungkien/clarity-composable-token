;; Composable Non Fungible Token
(define-non-fungible-token composable-token int)

;; Storage
(define-map token-spender ((token-id int)) ((spender principal)))
(define-map token-count ((owner principal)) ((count int)))
(define-map account-operator ((operator principal) (account principal)) ((is-approved bool)))
(define-map parent-token ((token-id int)) ((parent-id int)))
(define-map child-tokens ((parent-id int)) ((child-ids (list 10 int))))

;; Constant
(define-constant same-spender-err (err u1))
(define-constant not-approved-spender-err (err u2))
(define-constant failed-to-move-token-err (err u3))
(define-constant unauthorized-transfer-err (err u4))
(define-constant failed-to-mint-err (err u5))
(define-constant zero-id-err (err u6))
(define-constant failed-to-attach-err (err u7))
(define-constant failed-to-detach-err (err u8))


(define-private (balance-of (account principal))
  (default-to 0
    (get count
      (map-get? token-count {owner: account})
    )
  )
)

(define-public (owner-of? (token-id int))
  (ok (nft-get-owner? composable-token token-id))
)

(define-private (is-spender-approved (spender principal) (token-id int))
  (let
    ((approve-spender
        (unwrap!
          (get spender
            (map-get? token-spender {token-id: token-id}))
          false
        )
    ))
    (is-eq spender approve-spender)
  )
)

(define-private (is-operator-approved (operator principal) (account principal))
  (unwrap!
    (get is-approved
      (map-get? account-operator { operator: operator, account: account })
    )
    false
  )
)

(define-private (is-owner (actor principal) (token-id int))
  (is-eq
    (unwrap! (nft-get-owner? composable-token token-id) false)
    actor
  )
)

(define-private (can-transfer (actor principal) (token-id int))
  (or
    (is-owner actor token-id)
    (is-spender-approved actor token-id)
    (is-operator-approved
      actor
      (unwrap! (nft-get-owner? composable-token token-id) false)
    )
  )
)

;; only token owner or operator can attach token to parent
(define-private (can-attach (actor principal) (token-id int) (parent-id int))
  (and
    (or
      (is-owner actor token-id)
      (is-operator-approved
        actor
        (unwrap! (nft-get-owner? composable-token token-id) false)
      )
    )
    (not (is-eq token-id parent-id))
    (is-eq
      0
      (unwrap! (get parent-id (map-get? parent-token {token-id: token-id})) false)
    )
    ;; parent of parent-id must not be current token-id
    (not
      (is-eq
        token-id
        (unwrap! (get parent-id (map-get? parent-token {token-id: parent-id})) false)
      )
    )
  )
)

;; only token owner or operator can detach token from parent
(define-private (can-detach (actor principal) (token-id int) )
  (and
    (or
      (is-owner actor token-id)
      (is-operator-approved
        actor
        (unwrap! (nft-get-owner? composable-token token-id) false)
      )
    )
    (>
      (unwrap! (get parent-id (map-get? parent-token {token-id: token-id})) false)
      0
    )
  )
)

(define-private (register-token (new-owner principal) (token-id int))
  (let
    ((current-balance (balance-of new-owner)))
    (begin
      (nft-mint? composable-token token-id new-owner)
      (map-set token-count
        {owner: new-owner}
        {count: (+ 1 current-balance)}
      )
      true
    )
  )
)

(define-public (mint-token (owner principal) (token-id int))
  (if (is-eq token-id 0)
    zero-id-err
    (begin
      (if (register-token owner token-id)
        (ok token-id)
        failed-to-mint-err
      )
    )
  )
)

(define-private (release-token (owner principal) (token-id int))
  (let
    ((current-balance (balance-of owner)))
    (begin
      (map-delete token-spender {token-id: token-id})
      (map-set token-count
        {owner: owner}
        {count: (- current-balance 1)}
      )
      true
    )
  )
)

;;(define-private (filter-id (child-ids (list 10 int)) (child-id int))
;;
;;)


;; Public function
(define-public (set-spender-approval (spender principal) (token-id int))
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
          {token-id: token-id}
          {spender: spender}
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
        {operator: operator, account: tx-sender}
        {is-approved: is-approved}
      )
      (ok true)
    )
  )
)

(define-public (attach (owner principal) (token-id int) (parent-id int))
  (if
    (and
      (can-attach tx-sender token-id parent-id)
      (is-owner owner token-id)
      (is-owner owner parent-id)
    )
    ;; attach
    (begin
      (map-set parent-token
        {token-id: token-id}
        {parent-id: parent-id}
      )
      (let ((current-child-ids (unwrap! (get child-ids (map-get? child-tokens {parent-id: parent-id})) (err u100))))
        (let ((new-child-ids (unwrap! (as-max-len? (append current-child-ids token-id) u10) (err u100))))
          (map-set child-tokens
            {parent-id: parent-id}
            {child-ids: new-child-ids}
          )
        )
      )
      (ok token-id)
    )
    failed-to-attach-err
  )
)


(define-public (detach (owner principal) (token-id int) (parent-id int))
  (if
    (and
      (can-detach tx-sender token-id)
      (is-owner owner token-id)
      (is-owner owner parent-id)
    )
    ;; dettach
    (begin
      (map-set parent-token
        {token-id: token-id}
        {parent-id: 0}
      )
      ;;(let ((current-child-ids (unwrap! (get child-ids (map-get? child-tokens {parent-id: parent-id})) (list))))
      ;;  (let ((new-child-ids (unwrap! (as-max-len? (append current-child-ids token-id) u10) (list))))
      ;;    (map-set child-tokens
      ;;      {parent-id: parent-id}
      ;;      {child-ids: new-child-ids}
      ;;    )
      ;;  )
      ;;)
      (ok token-id)
    )
    failed-to-attach-err
  )
)


(define-public (transfer-from (owner principal) (recipient principal) (token-id int))
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
          {owner: owner}
          {count: (- (balance-of owner) 1) }
        )
        (map-set token-count
          {owner: recipient}
          {count: (+ (balance-of recipient) 1)}
        )
      )
      (ok token-id)
      failed-to-move-token-err
    )
    unauthorized-transfer-err
  )
)

(define-public (transfer (recipient principal) (token-id int))
  (transfer-from tx-sender recipient token-id)
)

