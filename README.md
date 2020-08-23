# Composable Token Contract

## Motivation

When we creating dapps or especially games on blockchain, we are getting familiar with non-fungible-tokens like pet, hero, monster... Each entity in games is designed as an NFT token

![hero](https://raw.githubusercontent.com/dotrungkien/clarity-composable-token/master/hero.jpg)

Everything works well until we need to create items system.

Items also are NFT tokens, and will be attached to hero in games.

The nightmare begins when we try to attach many items to a hero, likes sword, helmet, gloves, boost... and with each item, it may also have many other items attached to it, and of course, those can be any NFT or FT token, too.

So if we use NFT standalone, the attachment and detachment process, transferring items will become painful when the items system becomes large and complex with so many transactions required. The game performance may be broken.

That is the motivation for creating a new type of token - a **composable-token**, where any NFT token can be attached to or detached from any NFT token at any time. Thus we can easily, automatically transfer whole heroes along with all attached items in one transaction, or we can detach any items before sending those.

## Specification

![tokens](https://raw.githubusercontent.com/dotrungkien/clarity-composable-token/master/tokens.png)

- The Composable Token is a nft token, based on ERC721 token.
- Each token can have only one parent, and can have many childs.
- When attaching token A to token B:
  - token A must be different than token B
  - parent of token B must be different than token A to avoid recursion attachment.
  - token A and B both belong to the same owner.
  - update parent for token A, and childs for token B.
- When detaching token A from token B
  - token A must be attaching on token B.
  - update parent for token A, and childs for token B.
- When transfering token A to new owner
  - all attached token will be transfered, too.
  - update the token count for sender and receipent.

## Implementation

- Checkout [contract](contracts/composable-token.clar) for more information.

## Test

- Checkout [test-cases](test/testcase.md) for detail test cases of the composable token.

- Checkout [test-client](test/composable-token-client.ts) for more information about the client of the composable token, which wrapping all contract functions here, thus we can easily call query or invoke transaction.

- Checkout [test file](test/composable-token.test.ts) for tests implementation.

## License

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)](https://github.com/dotrungkien/clarity-composable-token/blob/master/LICENSE)
