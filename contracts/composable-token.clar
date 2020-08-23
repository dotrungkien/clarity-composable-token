;; Composable Non Fungible Token
(define-non-fungible-token composable-token int)

;; Storage
(define-map token-count ((owner principal)) ((count int)))
(define-map child-count ((token-id int)) ((count int)))
(define-map parent-token ((token-id int)) ((parent-id int)))
(define-map child-token ((parent-id int)) ((left-child-id int) (right-child-id int)))

;; Constant
(define-constant max-child-depth 2)
(define-constant contract-owner 'STCYMDQ2B7WPTN1NDQ1HAADCYS1RKWGQ5KF09E61)

(define-constant same-spender-err (err u1))
(define-constant not-approved-spender-err (err u2))
(define-constant failed-to-move-token-err (err u3))
(define-constant unauthorized-transfer-err (err u4))
(define-constant failed-to-mint-err (err u5))
(define-constant zero-id-err (err u6))
(define-constant failed-to-attach-err (err u7))
(define-constant failed-to-detach-err (err u8))

;; ------------------ PRIVATE FUNCTION -----------------

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

(define-private (is-owner (actor principal) (token-id int))
  (is-eq
    (unwrap! (nft-get-owner? composable-token token-id) false)
    actor
  )
)

(define-private (child-count-of (token-id int))
  (default-to 0
    (get count
      (map-get? child-count {token-id: token-id})
    )
  )
)

(define-private (left-child-of (parent-id int))
  (default-to 0
    (get left-child-id
      (map-get? child-token {parent-id: parent-id})
    )
  )
)

(define-private (right-child-of (parent-id int))
  (default-to 0
    (get right-child-id
      (map-get? child-token {parent-id: parent-id})
    )
  )
)

(define-private (child-depth-of (token-id int))
  (if (is-eq (child-count-of token-id) 0)
    ;; zero child, child-depth = 0
    0
    (if (is-eq (child-count-of token-id) 1)
      (if (not (is-eq (left-child-of token-id) 0))
        ;; has only left-child
        (let ((left-child (left-child-of token-id)))
          (if (is-eq (child-count-of left-child) 0)
            ;; left-child has no child, child-depth = 1
            1
            ;; lef-child has some childs, child-depth = 2
            2
          )
        )

        ;; has only right-child
        (let ((right-child (right-child-of token-id)))
          (if (is-eq (child-count-of right-child) 0)
            ;; right-child has no child, child-depth = 1
            1
            ;; right-child has some childs, child-depth = 2
            2
          )
        )
      )
      ;; has both left and right child
      (let ((left-child (left-child-of token-id)))
        (if (> (child-count-of left-child) 0)
          ;; left-child has some child, child-depth = 1
          2
          ;; left-child has no childs, check right-child
          (let ((right-child (right-child-of token-id)))
            (if (> (child-count-of right-child) 0)
              ;; right-child has some childs, child-depth = 2
              2
              ;; right-child has no child, child-depth = 1
              1
            )
          )
        )
      )
    )
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
;; parent-id has less than 2 child (max child)
;; total depth is less or equal than 2 (max-child-depth), detail bellow
(define-private (can-attach (actor principal) (token-id int) (parent-id int))
  (and
    (is-owner actor token-id)
    (is-owner actor parent-id)
    (not (is-eq token-id parent-id))
    (> token-id 0)
    (> parent-id 0)
    (is-eq 0 (parent-of token-id))
    (not (is-eq token-id (parent-of parent-id)))
    (< (child-count-of parent-id) 2)
    (if (is-eq (parent-of parent-id) 0)
      ;; parent has no parent, max token-id child depth is less than 2
      (< (child-depth-of token-id) max-child-depth)
      ;; grandpa-id has no parent, max token-id child depth must be zero
      (let ((grandpa-id (parent-of parent-id)))
        (if (is-eq (parent-of grandpa-id) 0)
          (is-eq 0 (child-depth-of token-id))
          ;; false because parent-id is already max-depth-child of another token
          false
        )
      )
    )
  )
)

;; both token-id must belong to the same user
;; token-id must have a parent
(define-private (can-detach (token-id int))
  (and
    (is-owner tx-sender token-id)
    (> (parent-of token-id) 0)
  )
)

(define-private (attach-to-left-child (token-id int) (parent-id int) )
  (map-set child-token
    {parent-id: parent-id}
    {left-child-id: token-id, right-child-id: (right-child-of parent-id) }
  )
)

(define-private (detach-from-left-child (parent-id int) )
  (map-set child-token
    {parent-id: parent-id}
    {left-child-id: 0, right-child-id: (right-child-of parent-id) }
  )
)

(define-private (attach-to-right-child (token-id int) (parent-id int))
  (map-set child-token
    {parent-id: parent-id}
    {left-child-id: (left-child-of parent-id), right-child-id: token-id }
  )
)

(define-private (detach-from-right-child (parent-id int))
  (map-set child-token
    {parent-id: parent-id}
    {left-child-id: (left-child-of parent-id), right-child-id: 0 }
  )
)

(define-private (transfer-left-child (parent-id int) (new-owner principal))
  (let ((left-child-id (left-child-of parent-id)))
    (if (not (is-eq 0 left-child-id))
      (begin
        ;; transfer left-child
        (nft-transfer? composable-token left-child-id tx-sender new-owner)
        ;; transfer left-child of left-child if exists
        (let ((left-left-child-id (left-child-of left-child-id)))
          (if (not (is-eq 0 left-left-child-id))
            (nft-transfer? composable-token left-left-child-id tx-sender new-owner)
            failed-to-move-token-err
          )
        )
        ;; transfer right-child of left-child if exists
        (let ((right-left-child-id (right-child-of left-child-id)))
          (if (not (is-eq 0 right-left-child-id))
            (nft-transfer? composable-token right-left-child-id tx-sender new-owner)
            failed-to-move-token-err
          )
        )
      )
      failed-to-move-token-err
    )
  )
)

(define-private (transfer-right-child (parent-id int) (new-owner principal))
  (let ((right-child-id (right-child-of parent-id)))

    (if (not (is-eq 0 right-child-id))
      ( begin
        ;; transfer right-child
        (nft-transfer? composable-token right-child-id tx-sender new-owner)
        ;; transfer left-child of right-child if exists
        (let ((left-right-child-id (left-child-of right-child-id)))
          (if (not (is-eq 0 left-right-child-id))
            (nft-transfer? composable-token left-right-child-id tx-sender new-owner)
            failed-to-move-token-err
          )
        )
        ;; transfer right-child of right-child if exists
        (let ((right-right-child-id (right-child-of right-child-id)))
          (if (not (is-eq 0 right-right-child-id))
            (nft-transfer? composable-token right-right-child-id tx-sender new-owner)
            failed-to-move-token-err
          )
        )
      )
      failed-to-move-token-err
    )
  )
)


(define-private (child-depth-count-of (token-id int))
  (if (is-eq (child-count-of token-id) 0)
    ;; zero child, child-depth = 0
    0
    (if (is-eq (child-count-of token-id) 1)
      ;; has only lef-child
      (let ((left-child (left-child-of token-id)))
        (+ 1 (child-count-of left-child))
      )
      ;; has both left and right child
      (let ((left-child (left-child-of token-id)) (right-child (right-child-of token-id)))
        (+ 1 (child-count-of left-child) (child-count-of right-child))
      )
    )
  )
)


;; ------------------ PUBLIC FUNCTION ------------------

(define-public (owner-of? (token-id int))
  (ok (nft-get-owner? composable-token token-id))
)

(define-public (get-child-count-of (token-id int))
  (ok (child-count-of token-id))
)

;; count all child by depth
(define-public (all-child-by-depth-of (token-id int))
  (ok (child-depth-count-of token-id))
)

;; mint a new nft token for owner
;; only contract owner can do this
(define-public (mint-token (owner principal) (token-id int))
  (if (is-eq tx-sender contract-owner)
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
    failed-to-mint-err
  )
)

;; attach token-id to parent-id
(define-public (attach (token-id int) (parent-id int))
  (if (can-attach tx-sender token-id parent-id)
    (begin

      ;; update parent for token-id
      (map-set parent-token
        {token-id: token-id}
        {parent-id: parent-id}
      )

      ;; update childs for parent-id
      (if (is-eq 0 (left-child-of parent-id))
        (attach-to-left-child token-id parent-id)
        (attach-to-right-child token-id parent-id)
      )

      ;; update child count for parent-id
      (map-set child-count
        {token-id: parent-id}
        {count: (+ (child-count-of parent-id) 1)}
      )
      (ok token-id)
    )
    failed-to-attach-err
  )
)

;; detach token-id from its parent
(define-public (detach (token-id int))
  (if (can-detach token-id)
    (let ((parent-id (parent-of token-id)))
      (begin
        ;; update parent of token-id
        (map-set parent-token
          {token-id: token-id}
          {parent-id: 0}
        )

        ;; update childs of parent-id
        (if (is-eq (left-child-of parent-id) token-id)
          (detach-from-left-child parent-id)
          (detach-from-right-child parent-id)
        )

        ;; update child-count of parent-id
        (map-set child-count
          {token-id: parent-id}
          {count: (- (child-count-of parent-id) 1)}
        )
        (ok token-id)
      )
    )
    failed-to-detach-err
  )
)

(define-public (transfer (new-owner principal) (token-id int))
  (begin
    ;; detach from parent
    (if (not (is-eq 0 (parent-of token-id)))
      (detach token-id)
      failed-to-move-token-err
    )

    ;; trasnfer left-child if exist
    (transfer-left-child token-id new-owner)

    ;; trasnfer right-child if exist
    (transfer-right-child token-id new-owner)

    ;; transfer token-id
    (nft-transfer? composable-token token-id tx-sender new-owner)

    ;; update token count
    (let ((total-transfer-count (+ (child-depth-count-of token-id) 1)))
      (begin
        ;; update token count of tx-sender
        (map-set token-count
          {owner: tx-sender}
          {count: (- (balance-of tx-sender) total-transfer-count)}
        )
        ;; update token count of new-owner
        (map-set token-count
          {owner: new-owner}
          {count: (+ (balance-of new-owner) total-transfer-count)}
        )
        (ok true)
      )
    )
  )
)