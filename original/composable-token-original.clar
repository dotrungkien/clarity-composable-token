;; Composable Non Fungible Token
(define-non-fungible-token composable-token-original int)

;; Storage
(define-map token-spender ((token-id int)) ((spender principal)))
(define-map token-count ((owner principal)) ((count int)))
(define-map account-operator ((operator principal) (account principal)) ((is-approved bool)))
(define-map parent-token ((token-id int)) ((parent-id int)))
(define-map child-tokens ((parent-id int)) ((child-ids (list 2 int))))

;; Constant
(define-constant max-child-num 2)
(define-constant max-child-depth 2)

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
  (ok (nft-get-owner? composable-token-original token-id))
)

(define-private (parent-of (token-id int))
  (default-to 0
    (get parent-id
      (map-get? parent-token {token-id: token-id})
    )
  )
)

(define-private (childs-of (parent-id int))
  (unwrap! (get child-ids (map-get? child-tokens {parent-id: parent-id})) (list))
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
    (unwrap! (nft-get-owner? composable-token-original token-id) false)
    actor
  )
)

(define-private (can-transfer (actor principal) (token-id int))
  (or
    (is-owner actor token-id)
    (is-spender-approved actor token-id)
    (is-operator-approved
      actor
      (unwrap! (nft-get-owner? composable-token-original token-id) false)
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
        (unwrap! (nft-get-owner? composable-token-original token-id) false)
      )
    )
    (not (is-eq token-id parent-id))

    (is-none
      (get parent-id (map-get? parent-token {token-id: token-id}))
    )
    ;; parent of parent-id must not be current token-id
    (or
      (is-none
        (get parent-id (map-get? parent-token {token-id: parent-id}))
      )
      (not
        (is-eq
          token-id
          (unwrap! (get parent-id (map-get? parent-token {token-id: parent-id})) false)
        )
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
        (unwrap! (nft-get-owner? composable-token-original token-id) false)
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
      (nft-mint? composable-token-original token-id new-owner)
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

;; Public function
(define-public (set-spender-approval (spender principal) (token-id int))
  (if (is-eq spender tx-sender)
    same-spender-err
    (if
      (or
        (is-owner tx-sender token-id)
        (is-operator-approved
          tx-sender
          (unwrap! (nft-get-owner? composable-token-original token-id) not-approved-spender-err)
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

(define-private (add-to (child-ids (list 2 int)) (token-id int))
  (unwrap! (as-max-len? (append child-ids token-id) u2) child-ids)
)

(define-public (attach (owner principal) (token-id int) (parent-id int))
  (if
    (and
      (can-attach tx-sender token-id parent-id)
      (is-owner owner token-id)
      (is-owner owner parent-id)
      (< (len (childs-of parent-id)) u2)
    )
    ;; attach
    (begin
      (map-set parent-token
        {token-id: token-id}
        {parent-id: parent-id}
      )

      (map-set child-tokens
        {parent-id: parent-id}
        {child-ids: (add-to (childs-of parent-id) token-id ) }
      )
      (ok token-id)
    )
    failed-to-attach-err
  )
)


(define-public (detach (owner principal) (token-id int))
  (if
    (and
      (can-detach tx-sender token-id)
      (is-owner owner token-id)
    )
    ;; dettach
    (begin
      (map-set parent-token
        {token-id: token-id}
        {parent-id: 0}
      )

      ;; TODO: remove childrend from parent's chil-ids list
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
        (unwrap-panic (nft-transfer? composable-token-original token-id owner recipient))
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

