# Composable token test cases

## action by user U1

- each token has max 2 child
- each token has max 2 depth child (token -> child -> child-of-child)
- attach new token A to token B

  - Token A is children of token B
  - Token B is parent of token A
  - Token B has 1 child
  - Token A has 0 child
  - Token A child depth is 0
  - Token B child depth is 1

- attach token B to token A

  - not success because recursion attachment

- attach token B to token C
  - Token B is child of token C
  - token C is parent of token B
  - token B has 1 child
  - token C has 1 child
  - token B child depth is 1
  - token C child depth is 2
- attach new token D to token B
  - Token D is children of token B
  - Token B is parent of token B
  - Token B has 2 child
  - Token D has 0 child
  - Token D child depth is 0
  - Token B child depth is 1
- detach token A from token B

  - Token A has no parent
  - Token B has 1 child
  - Token A has 0 child
  - Token A child depth is 0
  - Token B child depth is 1
  - token C child depth is 2

- Transfer token C to new user U2

  - owner of C become U2
  - owner of B also become U2
  - owner of D also becomr U2
  - user U1 token count is decreased by 3
  - user U2 token count is increased by 3

- detach token D from token B
  - not success because token D and token B is no longer belongs to U1

## acion by user U2

- detach token D from token B

  - Token D has no parent
  - Token B has 1 child
  - Token D has 0 child
  - Token D child depth is 0
  - Token B child depth is 0
  - token C child depth is 1

- Attach token D to token A
  - not success because token A is not owned by U2
