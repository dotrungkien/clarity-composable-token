# Composable token test cases

- each token has max 2 child
- max depth child 2 (token -> child -> child-of-child)

## action by user U1

- attach new token #1 to token #2

  ![1](imgs/1.png)

  - token #1 is children of token #2
  - token #2 is parent of token #1
  - token #2 has 1 child
  - left child of token #2 is #1
  - right child of token #2 is none
  - token #1 has 0 child
  - token #1 child depth is 0
  - token #2 child depth is 1

- attach token #2 to token #1

  - not success because recursion attachment

- attach token #2 to token #3

  ![2](imgs/2.png)

  - token #2 is child of token #3
  - token #3 is parent of token #2
  - token #2 has 1 child
  - left child of token #3 is B
  - right child of token #3 is none
  - token #3 has 1 child
  - token #2 child depth is 1
  - token #3 child depth is 2

- attach new token #4 to token #2

  ![3](imgs/3.png)

  - token #4 is children of token #2
  - token #2 is parent of token #4
  - token #2 has 2 child
  - left child of token #2 is #1
  - right child of token #2 is #4
  - token #4 has 0 child
  - token #4 child depth is 0
  - token #2 child depth is 1
  - token #3 total depth child is 3

- attach token #5 to token #1

  ![4](imgs/4.png)

  - not success because max child depth is 2, current relation is #3 -> #2 -> #1

- detach token #1 from token #2

  ![5](imgs/5.png)

  - token #1 has no parent
  - token #2 has 1 child
  - left child of token #2 is none
  - right child of token #2 is #4
  - token #1 has 0 child
  - token #1 child depth is none
  - token #2 child depth is 1
  - token #3 child depth is 2

- transfer token #3 to new user U2

  ![6](imgs/6.png)

  - owner of #3 become U2
  - owner of #2 also become U2
  - owner of #4 also becomr U2
  - user U1 token count is decreased by 3
  - user U2 token count is increased by 3

- detach token #4 from token #2
  - not success because token #4 and token #2 is no longer belongs to U1

## acion by user U2

- attach new token #6 to token #2

  ![7](imgs/7.png)

  - token #6 is children of token #2
  - token #2 is parent of token #6
  - token #6 has 0 child
  - token #2 has 2 child
  - left child of token #2 is #5
  - right child of token #2 is #4
  - token #6 child depth is 0
  - token #2 child depth is 1
  - token #3 child depth count is 3

- detach token #2 from token #3

  ![8](imgs/8.png)

  - token #2 has no parent
  - token #2 child depth is 1
  - token #3 child depth is 0
  - token #3 child count is 0

- attach token #1 to token #4
  - not success because token #1 is not owned by U2
