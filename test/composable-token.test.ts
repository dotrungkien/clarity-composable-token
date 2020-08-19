import { Provider, ProviderRegistry, Receipt } from '@blockstack/clarity';
import { ComposableToken } from './composable-token-client';
import { expect } from 'chai';

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

  const alice = addresses[0];
  const bob = addresses[1];
  const zoe = addresses[2];
  const yann = addresses[3];
  const contractOwner = 'STCYMDQ2B7WPTN1NDQ1HAADCYS1RKWGQ5KF09E61';

  before(async () => {
    provider = await ProviderRegistry.createProvider();
    instance = new ComposableToken(provider);
  });

  it('should have a valid syntax', async () => {
    await instance.checkContract();
    await instance.deployContract();
  });

  describe('Deploying an instance of the contract', () => {
    before(async () => {
      await instance.mintToken(alice, 1, { sender: contractOwner });
      await instance.mintToken(alice, 2, { sender: contractOwner });
      await instance.mintToken(bob, 3, { sender: contractOwner });
    });

    it("should initialize Alice's balance (2 asset)", async () => {
      const balanceAlice = await instance.balanceOf(alice);
      expect(balanceAlice).equal(2);
    });

    it("should initialize Bob's balance (1 asset)", async () => {
      const balanceBob = await instance.balanceOf(bob);
      expect(balanceBob).equal(1);
    });

    it('should make Alice owner of asset #1', async () => {
      const owner1 = await instance.ownerOf(1);
      expect(owner1).equal(`(ok (some ${alice}))`);
    });

    it('should make Alice owner of asset #2', async () => {
      const owner2 = await instance.ownerOf(2);
      expect(owner2).equal(`(ok (some ${alice}))`);
    });

    it('should make Bob owner of asset #3', async () => {
      const owner3 = await instance.ownerOf(3);
      expect(owner3).equal(`(ok (some ${bob}))`);
    });
  });

  describe('Alice transfering asset #1 to Bob', () => {
    before(async () => {
      await instance.transfer(bob, 1, { sender: alice });
    });

    it("should decrease Alice's balance (1 asset)", async () => {
      const balanceAlice = await instance.balanceOf(alice);
      expect(balanceAlice).equal(1);
    });

    it("should increase Bob's balance (2 assets)", async () => {
      const balanceBob = await instance.balanceOf(bob);
      expect(balanceBob).equal(2);
    });

    it('should make Bob owner of asset #1', async () => {
      const owner1 = await instance.ownerOf(1);
      expect(owner1).equal(`(ok (some ${bob}))`);
    });
  });

  describe('Alice transfering an asset that she does NOT own to Yann', () => {
    let receipt: Receipt;

    before(async () => {
      receipt = await instance.transfer(bob, 3, { sender: alice });
    });

    it('should return an invalid receipt', async () => {
      expect(receipt.success).false;
    });

    it("should not increase Yann's balance (0 assets)", async () => {
      const balanceYann = await instance.balanceOf(yann);
      expect(balanceYann).equal(0);
    });

    it("should not decrease Bob's balance (2 assets)", async () => {
      const balanceBob = await instance.balanceOf(bob);
      expect(balanceBob).equal(2);
    });
  });

  describe('Alice transfering an asset that she owns to herself', () => {
    let receipt: Receipt;

    before(async () => {
      receipt = await instance.transfer(alice, 2, { sender: alice });
    });

    it('should return an invalid receipt', async () => {
      expect(receipt.success).false;
    });

    it("should not increase Yann's balance (0 assets)", async () => {
      const balanceAlice = await instance.balanceOf(alice);
      expect(balanceAlice).equal(1);
    });

    it("should not decrease Bob's balance (2 assets)", async () => {
      const balanceBob = await instance.balanceOf(bob);
      expect(balanceBob).equal(2);
    });
  });

  describe('Alice transfering an asset that she does NOT own to herself', () => {
    let receipt: Receipt;

    before(async () => {
      receipt = await instance.transfer(alice, 3, { sender: alice });
    });

    it('should return an invalid receipt', async () => {
      expect(receipt.success).false;
    });

    it("should not increase Alice's balance (1 assets)", async () => {
      const balanceAlice = await instance.balanceOf(alice);
      expect(balanceAlice).equal(1);
    });

    it("should not decrease Bob's balance (2 assets)", async () => {
      const balanceBob = await instance.balanceOf(bob);
      expect(balanceBob).equal(2);
    });
  });

  describe('Bob approving Zoe to trade the asset #3 on his behalf', () => {
    before(async () => {
      await instance.setSpenderApproval(zoe, 3, { sender: bob });
    });

    it('should make Zoe able to transfer asset #3', async () => {
      const allowanceZoe = await instance.canTransfer(zoe, 3);
      expect(allowanceZoe).true;
    });

    it('should NOT make Zoe able to transfer asset #1', async () => {
      const allowanceZoe = await instance.canTransfer(zoe, 1);
      expect(allowanceZoe).false;
    });

    describe('Zoe transfering asset #3 from Alice to Bob', () => {
      let receipt: Receipt;

      before(async () => {
        receipt = await instance.transferFrom(alice, bob, 3, { sender: zoe });
      });

      it('should return an invalid receipt', async () => {
        expect(receipt.success).false;
      });

      it("should not increase Alice's balance (1 assets)", async () => {
        const balanceAlice = await instance.balanceOf(alice);
        expect(balanceAlice).equal(1);
      });

      it("should not decrease Bob's balance (2 assets)", async () => {
        const balanceBob = await instance.balanceOf(bob);
        expect(balanceBob).equal(2);
      });
    });

    describe('Zoe transfering asset #3 to Alice on Bob behalf', () => {
      before(async () => {
        await instance.transferFrom(bob, alice, 3, { sender: zoe });
      });

      it("should increase Alice's balance (2 asset)", async () => {
        const balanceAlice = await instance.balanceOf(alice);
        expect(balanceAlice).equal(2);
      });

      it("should decrease Bob's balance (1 asset)", async () => {
        const balanceBob = await instance.balanceOf(bob);
        expect(balanceBob).equal(1);
      });

      it('should make Alice owner of asset #2', async () => {
        const owner2 = await instance.ownerOf(2);
        expect(owner2).equal(`(ok (some ${alice}))`);
      });

      it("should revoke Zoe's ability to trade asset #2", async () => {
        const allowanceZoe = await instance.canTransfer(zoe, 2);
        expect(allowanceZoe).false;
      });
    });
  });

  describe('Alice approving Yann as an operator', () => {
    before(async () => {
      await instance.setOperatorApproval(yann, true, { sender: alice });
    });

    it('should NOT make Yann able to transfer asset #1', async () => {
      const allowanceYann = await instance.canTransfer(yann, 1);
      expect(allowanceYann).false;
    });

    it('should make Yann able to transfer asset #2', async () => {
      const allowanceYann = await instance.canTransfer(yann, 2);
      expect(allowanceYann).true;
    });

    it('should make Yann able to transfer asset #3', async () => {
      const allowanceYann = await instance.canTransfer(yann, 3);
      expect(allowanceYann).true;
    });

    describe('Yann transfering asset #1 from Alice to Bob', () => {
      let receipt: Receipt;

      before(async () => {
        receipt = await instance.transferFrom(alice, bob, 1, { sender: yann });
      });

      it('should return an invalid receipt', async () => {
        expect(receipt.success).false;
      });

      it("should not increase Alice's balance (2 assets)", async () => {
        const balanceAlice = await instance.balanceOf(alice);
        expect(balanceAlice).equal(2);
      });

      it("should not decrease Bob's balance (1 assets)", async () => {
        const balanceBob = await instance.balanceOf(bob);
        expect(balanceBob).equal(1);
      });
    });

    describe('Yann transfering asset #2 from Bob to Alice', () => {
      let receipt: Receipt;

      before(async () => {
        receipt = await instance.transferFrom(bob, alice, 2, { sender: yann });
      });

      it('should return an invalid receipt', async () => {
        expect(receipt.success).false;
      });

      it("should not increase Alice's balance (2 assets)", async () => {
        const balanceAlice = await instance.balanceOf(alice);
        expect(balanceAlice).equal(2);
      });

      it("should not decrease Bob's balance (1 assets)", async () => {
        const balanceBob = await instance.balanceOf(bob);
        expect(balanceBob).equal(1);
      });
    });

    describe('Yann transfering asset #2 from Alice to Bob', () => {
      let receipt: Receipt;

      before(async () => {
        receipt = await instance.transferFrom(alice, bob, 2, { sender: yann });
      });

      it('should return an valid receipt', async () => {
        expect(receipt.success).true;
      });

      it("should increase Alice's balance (1 assets)", async () => {
        const balanceAlice = await instance.balanceOf(alice);
        expect(balanceAlice).equal(1);
      });

      it("should decrease Bob's balance (2 assets)", async () => {
        const balanceBob = await instance.balanceOf(bob);
        expect(balanceBob).equal(2);
      });

      it('should make Bob owner of asset #2', async () => {
        const owner2 = await instance.ownerOf(2);
        expect(owner2).equal(`(ok (some ${bob}))`);
      });

      it("should revoke Yann's ability to trade asset #2", async () => {
        const allowanceYann = await instance.canTransfer(yann, 2);
        expect(allowanceYann).false;
      });
    });
    describe('Alice revoking Yann as an operator', () => {
      before(async () => {
        await instance.setOperatorApproval(yann, false, { sender: alice });
      });

      it("should revoke Yann's ability to trade asset #3", async () => {
        const allowanceYann = await instance.canTransfer(yann, 3);
        expect(allowanceYann).false;
      });
    });

    describe('Alice attach asset #6 to #4', () => {
      before(async () => {
        await instance.mintToken(alice, 4, { sender: contractOwner });
        await instance.mintToken(alice, 5, { sender: contractOwner });
        await instance.mintToken(alice, 6, { sender: contractOwner });
      });

      it('should make Alice able to attach her own asset #4', async () => {
        const canAttach = await instance.canAttach(alice, 4, 6);
        console.log(canAttach);
        expect(canAttach).true;
      });
    });
  });

  after(async () => {
    await provider.close();
  });
});
