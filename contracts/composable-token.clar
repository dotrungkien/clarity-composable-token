;; Composable Non Fungible Token
(define-non-fungible-token composable-token int)

;; Storage
(define-map token-count ((owner principal)) ((count int)))
(define-map child-count ((token-id int)) ((count int)))
(define-map parent-token ((token-id int)) ((parent-id int)))
(define-map child-token ((parent-id int)) ((child1 int) (child2 int)))

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

(define-public (owner-of? (token-id int))
  (ok (nft-get-owner? composable-token token-id))
)

(define-private (balance-of (account principal))
  (default-to 0
    (get count
      (map-get? token-count {owner: account})
    )
  )
)


(define-private (parent-of (token-id int))
  (default-to 0
    (get parent-id
      (map-get? parent-token {token-id: token-id})
    )
  )
)

(define-private (child-count-of (token-id int))
  (default-to 0
    (get count
      (map-get? child-count {token-id: token-id})
    )
  )
)

(define-private (child1-of (parent-id int))
  (default-to 0
    (get child1
      (map-get? child-token {parent-id: parent-id})
    )
  )
)

(define-private (is-owner (actor principal) (token-id int))
  (is-eq
    (unwrap! (nft-get-owner? composable-token token-id) false)
    actor
  )
)

(define-private (can-transfer (actor principal) (token-id int))
  (is-owner actor token-id)
)

;; both token-id and parent-id must belong to the same user
;; parent-id must not be the same with token-id
;; token-id must have no parent
;; token-id must greate than 0
;; parent-id must greate than 0
(define-private (can-attach (token-id int) (parent-id int))
  (and
    (is-owner tx-sender token-id)
    (is-owner tx-sender parent-id)
    (not (is-eq token-id parent-id))
    (> 0 token-id)
    (> 0 parent-id)
    (is-eq 0 (parent-of token-id))
    (not (is-eq token-id (parent-of parent-id)))
  )
)

;; both token-id and parent-id must belong to the same user
;; token-id must have a parent
;; parent-id must greate than 0
(define-private (can-detach (token-id int))
  (and
    (is-owner tx-sender token-id)
    (> (parent-of token-id) 0)
  )
)

;; mint a new nft token for owner
(define-public (mint-token (owner principal) (token-id int))
  (if (is-eq token-id 0)
    zero-id-err
    (let
      ((current-balance (balance-of owner)))
      (begin
        (nft-mint? composable-token token-id owner)
        (map-set token-count
          {owner: owner}
          {count: (+ 1 current-balance)}
        )
        (ok true)
      )
    )
  )
)

;;(define-public (mint-token (owner principal) (token-id int))
;;  (if (is-eq token-id 0)
;;    zero-id-err
;;    (begin
;;      (if (register-token owner token-id)
;;        (ok token-id)
;;        failed-to-mint-err
;;      )
;;    )
;;  )
;;)

;;(define-private (release-token (owner principal) (token-id int))
;;  (let
;;    ((current-balance (balance-of owner)))
;;    (begin
;;      (map-delete token-spender {token-id: token-id})
;;      (map-set token-count
;;        {owner: owner}
;;        {count: (- current-balance 1)}
;;      )
;;      true
;;    )
;;  )
;;)
;;
;;;; Public function
;;(define-public (set-spender-approval (spender principal) (token-id int))
;;  (if (is-eq spender tx-sender)
;;    same-spender-err
;;    (if
;;      (or
;;        (is-owner tx-sender token-id)
;;        (is-operator-approved
;;          tx-sender
;;          (unwrap! (nft-get-owner? composable-token token-id) not-approved-spender-err)
;;        )
;;      )
;;      (begin
;;        (map-set token-spender
;;          {token-id: token-id}
;;          {spender: spender}
;;        )
;;        (ok token-id)
;;      )
;;      not-approved-spender-err
;;    )
;;  )
;;)
;;
;;(define-public (set-operator-approval (operator principal) (is-approved bool))
;;  (if (is-eq operator tx-sender)
;;    same-spender-err
;;    (begin
;;      (map-set account-operator
;;        {operator: operator, account: tx-sender}
;;        {is-approved: is-approved}
;;      )
;;      (ok true)
;;    )
;;  )
;;)
;;
;;(define-private (add-to (child-ids (list 2 int)) (token-id int))
;;  (unwrap! (as-max-len? (append child-ids token-id) u2) child-ids)
;;)
;;
;;(define-public (attach (owner principal) (token-id int) (parent-id int))
;;  (if
;;    (and
;;      (can-attach tx-sender token-id parent-id)
;;      (is-owner owner token-id)
;;      (is-owner owner parent-id)
;;      (< (len (childs-of parent-id)) u2)
;;    )
;;    ;; attach
;;    (begin
;;      (map-set parent-token
;;        {token-id: token-id}
;;        {parent-id: parent-id}
;;      )
;;
;;      (map-set child-tokens
;;        {parent-id: parent-id}
;;        {child-ids: (add-to (childs-of parent-id) token-id ) }
;;      )
;;      (ok token-id)
;;    )
;;    failed-to-attach-err
;;  )
;;)
;;
;;
;;(define-public (detach (owner principal) (token-id int))
;;  (if
;;    (and
;;      (can-detach tx-sender token-id)
;;      (is-owner owner token-id)
;;    )
;;    ;; dettach
;;    (begin
;;      (map-set parent-token
;;        {token-id: token-id}
;;        {parent-id: 0}
;;      )
;;
;;      ;; TODO: remove childrend from parent's chil-ids list
;;      (ok token-id)
;;    )
;;    failed-to-attach-err
;;  )
;;)
;;
;;
;;(define-public (transfer-from (owner principal) (recipient principal) (token-id int))
;;  (if
;;    (and
;;      (can-transfer tx-sender token-id)
;;      (is-owner owner token-id)
;;      (not (is-eq owner recipient))
;;    )
;;    (if
;;      (and
;;        (unwrap-panic (nft-transfer? composable-token token-id owner recipient))
;;        (map-set token-count
;;          {owner: owner}
;;          {count: (- (balance-of owner) 1) }
;;        )
;;        (map-set token-count
;;          {owner: recipient}
;;          {count: (+ (balance-of recipient) 1)}
;;        )
;;      )
;;      (ok token-id)
;;      failed-to-move-token-err
;;    )
;;    unauthorized-transfer-err
;;  )
;;)
;;
;;(define-public (transfer (recipient principal) (token-id int))
;;  (transfer-from tx-sender recipient token-id)
;;)
;;
;;