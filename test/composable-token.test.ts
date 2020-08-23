import { Provider, ProviderRegistry, Receipt } from '@blockstack/clarity';
import { ComposableToken } from './composable-token-client';
import { expect } from 'chai';
import { isString } from 'util';

describe('ComposableToken Test Suite', () => {
  let instance: ComposableToken;
  let provider: Provider;

  const addresses = [
    'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
    'SP1DQW1980HVS71XPSW91A8K2W2R3ZAJ75M5M0K5W',
    'SP13VF98697SCY877MECN9CESFN5VHK8P744DB0TY',
    'SP33AV3DHD6P9XAPYKJ6JTEF83QRZXX6Q5YMVWS5X',
    'SP3DWF717EZRH2M4S16TZDVNZPWT7DG95ZK5YAS69',
  ];

  const u1 = addresses[0];
  const u2 = addresses[1];
  const deployer = 'STCYMDQ2B7WPTN1NDQ1HAADCYS1RKWGQ5KF09E61';

  before(async () => {
    provider = await ProviderRegistry.createProvider();
    instance = new ComposableToken(provider);
  });

  it('should have a valid syntax', async () => {
    await instance.checkContract();
    await instance.deployContract();
  });

  describe('deployer: mint some token for u1', () => {
    before(async () => {
      await instance.mintToken(u1, 1, { sender: deployer });
      await instance.mintToken(u1, 2, { sender: deployer });
      await instance.mintToken(u1, 3, { sender: deployer });
      await instance.mintToken(u1, 4, { sender: deployer });
      await instance.mintToken(u2, 5, { sender: deployer });
      await instance.mintToken(u2, 6, { sender: deployer });
    });

    it('u1 balance should be 4', async () => {
      const balance = await instance.balanceOf(u1);
      expect(balance).equal(4);
    });

    it('u2 balance should be 2', async () => {
      const balance = await instance.balanceOf(u2);
      expect(balance).equal(2);
    });

    it('should make u1 owner of token #1', async () => {
      const owner = await instance.ownerOf(1);
      expect(owner).equal(`(ok (some ${u1}))`);
    });

    it('should make u1 owner of token #2', async () => {
      const owner = await instance.ownerOf(2);
      expect(owner).equal(`(ok (some ${u1}))`);
    });

    it('should make u1 owner of token #3', async () => {
      const owner = await instance.ownerOf(3);
      expect(owner).equal(`(ok (some ${u1}))`);
    });

    it('should make u1 owner of token #4', async () => {
      const owner = await instance.ownerOf(4);
      expect(owner).equal(`(ok (some ${u1}))`);
    });

    it('should make u2 owner of token #5', async () => {
      const owner = await instance.ownerOf(5);
      expect(owner).equal(`(ok (some ${u2}))`);
    });

    it('should make u2 owner of token #6', async () => {
      const owner = await instance.ownerOf(6);
      expect(owner).equal(`(ok (some ${u2}))`);
    });
  });

  describe('u1: attach token #1 to token #2', () => {
    describe('check attach pre-condition', () => {
      it('u1 is owner of token #1', async () => {
        const isOwner = await instance.isOwner(u1, 1);
        expect(isOwner).true;
      });

      it('u1 is owner of token #2', async () => {
        const isOwner = await instance.isOwner(u1, 2);
        expect(isOwner).true;
      });

      it('token #1 has no parent', async () => {
        const parent = await instance.parentOf(1);
        expect(parent).null;
      });

      it('token #2 has no child', async () => {
        const childCount = await instance.childCountOf(2);
        expect(childCount).equal(0);
      });

      it('token #2 has no parent', async () => {
        const parent = await instance.parentOf(2);
        expect(parent).null;
      });

      it('can attach token #1 to token #2', async () => {
        const canAttach = await instance.canAttach(u1, 1, 2);
        expect(canAttach).true;
      });
    });

    describe('attach token #1 to token #2', () => {
      before(async () => {
        await instance.attach(1, 2, { sender: u1 });
      });

      it('parent of token #1 is token #2', async () => {
        const parent = await instance.parentOf(1);
        expect(parent).equal(2);
      });

      it('left child of token #2 is token #1', async () => {
        const leftChild = await instance.leftChildOf(2);
        expect(leftChild).equal(1);
      });

      it('right child of token #2 is null', async () => {
        const rightChild = await instance.rightChildOf(2);
        expect(rightChild).null;
      });

      it('token #1 has 0 child', async () => {
        const childCount = await instance.childCountOf(1);
        expect(childCount).equal(0);
      });

      it('token #1 child depth is 0', async () => {
        const childCount = await instance.childDepthOf(1);
        expect(childCount).equal(0);
      });

      it('token #2 has 1 child', async () => {
        const childCount = await instance.childCountOf(2);
        expect(childCount).equal(1);
      });

      it('token #2 child depth is 1', async () => {
        const childCount = await instance.childDepthOf(2);
        expect(childCount).equal(1);
      });
    });
  });

  describe('u1: attach token #2 to token #1', () => {
    it('not success because recursion attachment', async () => {
      let result = await instance.attach(1, 2, { sender: u1 });
      expect(result.success).false;
    });
  });

  describe('u1: attach token #2 to token #3', () => {
    describe('check attach pre-condition', () => {
      it('u1 is owner of token #3', async () => {
        const isOwner = await instance.isOwner(u1, 3);
        expect(isOwner).true;
      });

      it('token #3 has no child', async () => {
        const childCount = await instance.childCountOf(3);
        expect(childCount).equal(0);
      });

      it('token #3 has no parent', async () => {
        const parent = await instance.parentOf(3);
        expect(parent).null;
      });

      it('token #2 has no parent', async () => {
        const parent = await instance.parentOf(2);
        expect(parent).null;
      });

      it('can attach token #2 to token #3', async () => {
        const canAttach = await instance.canAttach(u1, 2, 3);
        expect(canAttach).true;
      });
    });

    describe('u1: attach token #2 to token #3', () => {
      before(async () => {
        await instance.attach(2, 3, { sender: u1 });
      });

      it('parent of token #2 is token #3', async () => {
        const parent = await instance.parentOf(2);
        expect(parent).equal(3);
      });

      it('left child of token #3 is token #2', async () => {
        const leftChild = await instance.leftChildOf(3);
        expect(leftChild).equal(2);
      });

      it('right child of token #3 is null', async () => {
        const rightChild = await instance.rightChildOf(3);
        expect(rightChild).null;
      });

      it('token #3 has 1 child', async () => {
        const childCount = await instance.childCountOf(3);
        expect(childCount).equal(1);
      });

      it('token #2 child depth is 1', async () => {
        const childCount = await instance.childDepthOf(2);
        expect(childCount).equal(1);
      });

      it('token #3 child depth is 2', async () => {
        const childCount = await instance.childDepthOf(3);
        expect(childCount).equal(2);
      });

      it('token #3 total child by depth is 2', async () => {
        const allChildByDepth = await instance.allChildByDepthOf(3);
        expect(allChildByDepth).equal(2);
      });

      it('token #2 has 1 child', async () => {
        const childCount = await instance.childCountOf(2);
        expect(childCount).equal(1);
      });

      it('token #2 child depth is 1', async () => {
        const childCount = await instance.childDepthOf(2);
        expect(childCount).equal(1);
      });
    });
  });

  describe('u1: attach token #4 to token #2', () => {
    describe('check attach pre-condition', () => {
      it('u1 is owner of token #4', async () => {
        const isOwner = await instance.isOwner(u1, 1);
        expect(isOwner).true;
      });

      it('token #4 has no parent', async () => {
        const parent = await instance.parentOf(4);
        expect(parent).null;
      });

      it('token #4 has no child', async () => {
        const childCount = await instance.childCountOf(4);
        expect(childCount).equal(0);
      });

      it('can attach token #4 to token #2', async () => {
        const canAttach = await instance.canAttach(u1, 4, 2);
        expect(canAttach).true;
      });
    });

    describe('attach token #4 to token #2', () => {
      before(async () => {
        await instance.attach(4, 2, { sender: u1 });
      });

      it('tparent of token #4 is token #2', async () => {
        const parent = await instance.parentOf(4);
        expect(parent).equal(2);
      });

      it('left child of token #2 is token #1', async () => {
        const leftChild = await instance.leftChildOf(2);
        expect(leftChild).equal(1);
      });

      it('right child of token #2 is token #4', async () => {
        const rightChild = await instance.rightChildOf(2);
        expect(rightChild).equal(4);
      });

      it('token #2 has 2 child', async () => {
        const childCount = await instance.childCountOf(2);
        expect(childCount).equal(2);
      });

      it('token #2 child depth is 1', async () => {
        const childCount = await instance.childDepthOf(2);
        expect(childCount).equal(1);
      });

      it('token #3 total child by depth is 3', async () => {
        const allChildByDepth = await instance.allChildByDepthOf(3);
        expect(allChildByDepth).equal(3);
      });
    });
  });

  describe('u1: attach token #5 to token #1', () => {
    it('not success because max depth exeeded', async () => {
      let result = await instance.attach(5, 1, { sender: u1 });
      expect(result.success).false;
    });
  });

  describe('u1: attach token #5 to token #2', () => {
    it('not success because token #2 has max child', async () => {
      let result = await instance.attach(5, 2, { sender: u1 });
      expect(result.success).false;
    });
  });

  describe('u1: detach token #1 from token #2', () => {
    describe('check detach pre-condition', () => {
      it('parent of token #1 is token #2', async () => {
        const parent = await instance.parentOf(1);
        expect(parent).equal(2);
      });

      it('token #2 has 2 child', async () => {
        const childCount = await instance.childCountOf(2);
        expect(childCount).equal(2);
      });

      it('left child token #2 is token #1', async () => {
        const leftChild = await instance.leftChildOf(2);
        expect(leftChild).equal(1);
      });
    });

    describe('detach token #1 from token #2', () => {
      before(async () => {
        await instance.detach(1, { sender: u1 });
      });

      it('parent of token #1 is null', async () => {
        const parent = await instance.parentOf(1);
        expect(parent).null;
      });

      it('left child of token #2 is null', async () => {
        const leftChild = await instance.leftChildOf(2);
        expect(leftChild).null;
      });

      it('right child of token #2 is token #4', async () => {
        const rightChild = await instance.rightChildOf(2);
        expect(rightChild).equal(4);
      });

      it('token #2 has 1 child', async () => {
        const childCount = await instance.childCountOf(2);
        expect(childCount).equal(1);
      });

      it('token #3 total child by depth is 2', async () => {
        const allChildByDepth = await instance.allChildByDepthOf(3);
        expect(allChildByDepth).equal(2);
      });
    });
  });

  describe('u1: transfer token #3 to new user U2', () => {
    describe('check transfer pre-condition', () => {
      it('u1 has total 4 token', async () => {
        let balance = await instance.balanceOf(u1);
        expect(balance).equal(4);
      });

      it('u2 has total 2 token', async () => {
        let balance = await instance.balanceOf(u2);
        expect(balance).equal(2);
      });
    });

    describe('transfer token #3 to U2', () => {
      before(async () => {
        await instance.transfer(u2, 3, { sender: u1 });
      });

      it('should make u2 owner of token #2', async () => {
        const owner = await instance.ownerOf(2);
        expect(owner).equal(`(ok (some ${u2}))`);
      });

      it('should make u2 owner of token #3', async () => {
        const owner = await instance.ownerOf(3);
        expect(owner).equal(`(ok (some ${u2}))`);
      });

      it('should make u2 owner of token #4', async () => {
        const owner = await instance.ownerOf(4);
        expect(owner).equal(`(ok (some ${u2}))`);
      });

      it('u1 balance was decreased by 3, now has total 1 token', async () => {
        let balance = await instance.balanceOf(u1);
        expect(balance).equal(1);
      });

      it('u2 balance was increased by 3,now has total 5 token', async () => {
        let balance = await instance.balanceOf(u2);
        expect(balance).equal(5);
      });
    });
  });

  describe('u1: attach token #1 to token #4', () => {
    it('not success because token #4 is no longer belong to u1', async () => {
      let result = await instance.attach(1, 4, { sender: u1 });
      expect(result.success).false;
    });
  });

  describe('u2: attach token #5 to token #2', () => {
    describe('check attach pre-condition', () => {
      it('u2 is owner of token #5', async () => {
        const isOwner = await instance.isOwner(u2, 5);
        expect(isOwner).true;
      });

      it('token #5 has no parent', async () => {
        const parent = await instance.parentOf(5);
        expect(parent).null;
      });

      it('token #5 has no child', async () => {
        const childCount = await instance.childCountOf(5);
        expect(childCount).equal(0);
      });

      it('can attach token #5 to token #2', async () => {
        const canAttach = await instance.canAttach(u2, 5, 2);
        expect(canAttach).true;
      });
    });

    describe('attach token #5 to token #2', () => {
      before(async () => {
        await instance.attach(5, 2, { sender: u2 });
      });

      it('parent of token #5 is token #2', async () => {
        const parent = await instance.parentOf(5);
        expect(parent).equal(2);
      });

      it('left child of token #2 is token #5', async () => {
        const leftChild = await instance.leftChildOf(2);
        expect(leftChild).equal(5);
      });

      it('right child of token #2 is token #4', async () => {
        const rightChild = await instance.rightChildOf(2);
        expect(rightChild).equal(4);
      });

      it('token #2 has 2 child', async () => {
        const childCount = await instance.childCountOf(2);
        expect(childCount).equal(2);
      });

      it('token #2 child depth is 1', async () => {
        const childCount = await instance.childDepthOf(2);
        expect(childCount).equal(1);
      });

      it('token #3 total child by depth is 3', async () => {
        const allChildByDepth = await instance.allChildByDepthOf(3);
        expect(allChildByDepth).equal(3);
      });
    });
  });

  describe('u2: detach token #2 from token #3', () => {
    describe('check detach pre-condition', () => {
      it('parent of token #2 is token #3', async () => {
        const parent = await instance.parentOf(2);
        expect(parent).equal(3);
      });

      it('token #3 has 1 child', async () => {
        const childCount = await instance.childCountOf(3);
        expect(childCount).equal(1);
      });

      it('left child token #3 is token #2', async () => {
        const leftChild = await instance.leftChildOf(3);
        expect(leftChild).equal(2);
      });
    });

    describe('detach token #2 from token #3', () => {
      before(async () => {
        await instance.detach(2, { sender: u2 });
      });

      it('parent of token #2 is null', async () => {
        const parent = await instance.parentOf(2);
        expect(parent).null;
      });

      it('left child of token #3 is null', async () => {
        const leftChild = await instance.leftChildOf(3);
        expect(leftChild).null;
      });

      it('token #3 has no child', async () => {
        const childCount = await instance.childCountOf(3);
        expect(childCount).equal(0);
      });

      it('token #3 child depth is 0', async () => {
        const childDepth = await instance.childDepthOf(3);
        expect(childDepth).equal(0);
      });

      it('token #3 total child by depth is 0', async () => {
        const allChildByDepth = await instance.allChildByDepthOf(3);
        expect(allChildByDepth).equal(0);
      });
    });
  });

  after(async () => {
    await provider.close();
  });
});
