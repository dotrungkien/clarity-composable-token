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

  describe('mint some token for u1', () => {
    before(async () => {
      await instance.mintToken(u1, 1, { sender: deployer });
      await instance.mintToken(u1, 2, { sender: deployer });
      await instance.mintToken(u1, 3, { sender: deployer });
      await instance.mintToken(u1, 4, { sender: deployer });
      await instance.mintToken(u1, 5, { sender: deployer });
      await instance.mintToken(u1, 6, { sender: deployer });
    });

    it('u1 balance should be 6', async () => {
      const balance = await instance.balanceOf(u1);
      expect(balance).equal(6);
    });

    it('u2 balance should be zero', async () => {
      const balance = await instance.balanceOf(u2);
      expect(balance).equal(0);
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
    it('should make u1 owner of token #5', async () => {
      const owner = await instance.ownerOf(5);
      expect(owner).equal(`(ok (some ${u1}))`);
    });
    it('should make u1 owner of token #6', async () => {
      const owner1 = await instance.ownerOf(6);
      expect(owner1).equal(`(ok (some ${u1}))`);
    });
  });

  describe('u1 attach token #1 to token #2', () => {
    describe('check attach pre-condition', () => {
      it('token #1 has no parent', async () => {
        const parent = await instance.parentOf(1);
        expect(parent).null;
      });
      it('u1 is owner of token #1', async () => {
        const isOwner = await instance.isOwner(u1, 1);
        expect(isOwner).true;
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

    // describe('attach token #1 to token #2', () => {
    //   before(async () => {
    //     await instance.attach(1, 2, { sender: u1 });
    //   });

    //   it('token #1 parent is token #2', async () => {
    //     const parent = await instance.parentOf(1);
    //     expect(parent).equal(2);
    //   });
    // });
  });

  after(async () => {
    await provider.close();
  });
});
