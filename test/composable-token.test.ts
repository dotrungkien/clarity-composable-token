import { Provider, ProviderRegistry, Receipt } from '@blockstack/clarity';
import { ComposableToken } from './composable-token-client';
import { expect } from 'chai';

describe('ComposableToken Test Suite', () => {
  let instance: ComposableToken;
  let provider: Provider;

  const addresses = [
    'SP2R8MPF1WYDQD2AZY9GCZRAVG8JYZ25FNB8X45EK',
    'SP1DQW1980HVS71XPSW91A8K2W2R3ZAJ75M5M0K5W',
    'SP13VF98697SCY877MECN9CESFN5VHK8P744DB0TY',
    'SP33AV3DHD6P9XAPYKJ6JTEF83QRZXX6Q5YMVWS5X',
    'SP3DWF717EZRH2M4S16TZDVNZPWT7DG95ZK5YAS69',
  ];

  const alice = addresses[0];
  const bob = addresses[1];
  const zoe = addresses[2];
  const yann = addresses[3];

  before(async () => {
    provider = await ProviderRegistry.createProvider();
    instance = new ComposableToken(provider);
    await instance.deployContract();
  });

  it('should have a valid syntax', async () => {
    await instance.checkContract();
  });

  describe('Deploying an instance of the contract', () => {
    it.only("should initialize Alice's balance (2 asset)", async () => {
      const balanceAlice = await instance.balanceOf(alice);
      expect(balanceAlice).equal(2);
    });

    it("should initialize Bob's balance (1 asset)", async () => {
      const balanceBob = await instance.balanceOf(bob);
      expect(balanceBob).equal(1);
    });

    it('should make Alice owner of asset #10001', async () => {
      const owner10001 = await instance.ownerOf(10001);
      expect(owner10001).equal(`(ok (some ${alice}))`);
    });

    it('should make Alice owner of asset #10002', async () => {
      const owner10002 = await instance.ownerOf(10002);
      expect(owner10002).equal(`(ok (some ${alice}))`);
    });

    it('should make Bib owner of asset #10003', async () => {
      const owner10003 = await instance.ownerOf(10003);
      expect(owner10003).equal(`(ok (some ${bob}))`);
    });
  });

  describe('Alice transfering asset #10001 to Bob', () => {
    beforeEach(async () => {
      await instance.transfer(bob, 10001, { sender: alice });
    });

    it("should decrease Alice's balance (1 asset)", async () => {
      const balanceAlice = await instance.balanceOf(alice);
      expect(balanceAlice).equal(1);
    });

    it("should increase Bob's balance (2 assets)", async () => {
      const balanceBob = await instance.balanceOf(bob);
      expect(balanceBob).equal(2);
    });

    it('should make Bob owner of asset #10001', async () => {
      const owner10001 = await instance.ownerOf(10001);
      expect(owner10001).equal(`(ok (some ${bob}))`);
    });
  });

  describe('Alice transfering an asset that she does NOT own to Yann', () => {
    let receipt: Receipt;

    beforeEach(async () => {
      receipt = await instance.transfer(bob, 10003, { sender: alice });
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

    beforeEach(async () => {
      receipt = await instance.transfer(alice, 10002, { sender: alice });
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

    beforeEach(async () => {
      receipt = await instance.transfer(alice, 10003, { sender: alice });
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

  describe('Bob approving Zoe to trade the asset #10003 on his behalf', () => {
    beforeEach(async () => {
      await instance.setSpenderApproval(zoe, 10003, { sender: bob });
    });

    it('should make Zoe able to transfer asset #10003', async () => {
      const allowanceZoe = await instance.canTransfer(zoe, 10003);
      expect(allowanceZoe).true;
    });

    it('should NOT make Zoe able to transfer asset #10001', async () => {
      const allowanceZoe = await instance.canTransfer(zoe, 10001);
      expect(allowanceZoe).false;
    });

    describe('Zoe transfering asset #10003 from Alice to Bob', () => {
      let receipt: Receipt;

      beforeEach(async () => {
        receipt = await instance.transferFrom(alice, bob, 10003, { sender: zoe });
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

    describe('Zoe transfering asset #10003 to Alice on Bob behalf', () => {
      beforeEach(async () => {
        await instance.transferFrom(bob, alice, 10003, { sender: zoe });
      });

      it("should increase Alice's balance (2 asset)", async () => {
        const balanceAlice = await instance.balanceOf(alice);
        expect(balanceAlice).equal(2);
      });

      it("should decrease Bob's balance (1 asset)", async () => {
        const balanceBob = await instance.balanceOf(bob);
        expect(balanceBob).equal(1);
      });

      it('should make Alice owner of asset #10002', async () => {
        const owner10002 = await instance.ownerOf(10002);
        expect(owner10002).equal(`(ok (some ${alice}))`);
      });

      it("should revoke Zoe's ability to trade asset #10002", async () => {
        const allowanceZoe = await instance.canTransfer(zoe, 10002);
        expect(allowanceZoe).false;
      });
    });
  });

  describe('Alice approving Yann as an operator', () => {
    beforeEach(async () => {
      await instance.setOperatorApproval(yann, true, { sender: alice });
    });

    it('should NOT make Yann able to transfer asset #10001', async () => {
      const allowanceYann = await instance.canTransfer(yann, 10001);
      expect(allowanceYann).false;
    });

    it('should make Yann able to transfer asset #10002', async () => {
      const allowanceYann = await instance.canTransfer(yann, 10002);
      expect(allowanceYann).true;
    });

    it('should make Yann able to transfer asset #10003', async () => {
      const allowanceYann = await instance.canTransfer(yann, 10003);
      expect(allowanceYann).true;
    });

    describe('Yann transfering asset #10001 from Alice to Bob', () => {
      let receipt: Receipt;

      beforeEach(async () => {
        receipt = await instance.transferFrom(alice, bob, 10001, { sender: yann });
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

    describe('Yann transfering asset #10002 from Bob to Alice', () => {
      let receipt: Receipt;

      beforeEach(async () => {
        receipt = await instance.transferFrom(bob, alice, 10002, { sender: yann });
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

    describe('Yann transfering asset #10002 from Alice to Bob', () => {
      let receipt: Receipt;

      beforeEach(async () => {
        receipt = await instance.transferFrom(alice, bob, 10002, { sender: yann });
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

      it('should make Bob owner of asset #10002', async () => {
        const owner10002 = await instance.ownerOf(10002);
        expect(owner10002).equal(`(ok (some ${bob}))`);
      });

      it("should revoke Yann's ability to trade asset #10002", async () => {
        const allowanceYann = await instance.canTransfer(yann, 10002);
        expect(allowanceYann).false;
      });
    });
    describe('Alice revoking Yann as an operator', () => {
      beforeEach(async () => {
        await instance.setOperatorApproval(yann, false, { sender: alice });
      });

      it("should revoke Yann's ability to trade asset #10003", async () => {
        const allowanceYann = await instance.canTransfer(yann, 10003);
        expect(allowanceYann).false;
      });
    });
  });

  after(async () => {
    await provider.close();
  });
});
