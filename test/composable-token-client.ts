import { Client, Provider, Receipt, Result } from '@blockstack/clarity';

export class ComposableToken extends Client {
  constructor(provider: Provider) {
    super(
      'STCYMDQ2B7WPTN1NDQ1HAADCYS1RKWGQ5KF09E61.composable-token',
      'composable-token',
      provider
    );
  }

  async balanceOf(owner: string): Promise<number> {
    const query = this.createQuery({ method: { name: 'balance-of', args: [`'${owner}`] } });
    const res = await this.submitQuery(query);
    return parseInt(res.result as string);
  }

  async parentOf(tokenId: number): Promise<number> {
    const query = this.createQuery({ method: { name: 'parent-of', args: [`${tokenId}`] } });
    const res = await this.submitQuery(query);
    const parentId = parseInt(res.result as string);
    return parentId ? parentId : null;
  }

  async ownerOf(tokenId: number): Promise<string> {
    const query = this.createQuery({ method: { name: 'owner-of?', args: [`${tokenId}`] } });
    const res = await this.submitQuery(query);
    return Result.unwrap(res).replace(/'/g, '');
  }

  async isOwner(actor: number): Promise<boolean> {
    const query = this.createQuery({ method: { name: 'is-owner', args: [`'${actor}`] } });
    const res = await this.submitQuery(query);
    return Result.unwrap(res) === 'true';
  }

  async childCountOf(tokenId: number): Promise<number> {
    const query = this.createQuery({ method: { name: 'child-count-of', args: [`${tokenId}`] } });
    const res = await this.submitQuery(query);
    return parseInt(res.result as string);
  }

  async leftChildOf(tokenId: number): Promise<number> {
    const query = this.createQuery({ method: { name: 'left-child-of', args: [`${tokenId}`] } });
    const res = await this.submitQuery(query);
    return parseInt(res.result as string);
  }

  async rightChildOf(tokenId: number): Promise<number> {
    const query = this.createQuery({ method: { name: 'right-child-of', args: [`${tokenId}`] } });
    const res = await this.submitQuery(query);
    return parseInt(res.result as string);
  }

  async childDepthOf(tokenId: number): Promise<number> {
    const query = this.createQuery({ method: { name: 'right-child-of', args: [`${tokenId}`] } });
    const res = await this.submitQuery(query);
    return parseInt(res.result as string);
  }

  async canTransfer(actor: string, tokenId: number): Promise<boolean> {
    const query = this.createQuery({
      method: { name: 'can-transfer', args: [`'${actor}`, `${tokenId}`] },
    });
    const res = await this.submitQuery(query);
    return Result.unwrap(res) === 'true';
  }

  async canAttach(tokenId: number, parentId: number): Promise<boolean> {
    const query = this.createQuery({
      method: { name: 'can-attach', args: [`${tokenId}`, `${parentId}`] },
    });
    const res = await this.submitQuery(query);
    return Result.unwrap(res) === 'true';
  }

  async canDetach(tokenId: number): Promise<boolean> {
    const query = this.createQuery({
      method: { name: 'can-detach', args: [`${tokenId}`] },
    });
    const res = await this.submitQuery(query);
    return Result.unwrap(res) === 'true';
  }

  async isSpenderApproved(spender: string, tokenId: number): Promise<number> {
    const query = this.createQuery({
      method: { name: 'is-spender-approved', args: [`'${spender}`, `${tokenId}`] },
    });
    const res = await this.submitQuery(query);
    return parseInt(Result.unwrap(res));
  }

  async isOperatorApproved(owner: string, operator: string): Promise<number> {
    const query = this.createQuery({
      method: { name: 'is-operator-approved', args: [`'${owner}`, `'${operator}`] },
    });
    const res = await this.submitQuery(query);
    return parseInt(Result.unwrap(res));
  }

  async setSpenderApproval(
    spender: string,
    tokenId: number,
    params: { sender: string }
  ): Promise<Receipt> {
    const tx = this.createTransaction({
      method: { name: 'set-spender-approval', args: [`'${spender}`, `${tokenId}`] },
    });
    await tx.sign(params.sender);
    const res = await this.submitTransaction(tx);
    return res;
  }

  async setOperatorApproval(
    operator: string,
    isApproved: boolean,
    params: { sender: string }
  ): Promise<Receipt> {
    const tx = this.createTransaction({
      method: { name: 'set-operator-approval', args: [`'${operator}`, `${isApproved}`] },
    });
    await tx.sign(params.sender);
    const res = await this.submitTransaction(tx);
    return res;
  }

  async transferFrom(
    from: string,
    to: string,
    tokenId: number,
    params: { sender: string }
  ): Promise<Receipt> {
    const tx = this.createTransaction({
      method: { name: 'transfer-from', args: [`'${from}`, `'${to}`, `${tokenId}`] },
    });
    await tx.sign(params.sender);
    const res = await this.submitTransaction(tx);
    return res;
  }

  async transfer(to: string, tokenId: number, params: { sender: string }): Promise<Receipt> {
    const tx = this.createTransaction({
      method: { name: 'transfer', args: [`'${to}`, `${tokenId}`] },
    });
    await tx.sign(params.sender);
    const res = await this.submitTransaction(tx);
    return res;
  }

  async attach(
    owner: string,
    tokenId: number,
    parentId: number,
    params: { sender: string }
  ): Promise<Receipt> {
    const tx = this.createTransaction({
      method: { name: 'attach', args: [`'${owner}`, `${tokenId}`, `${parentId}`] },
    });
    await tx.sign(params.sender);
    const res = await this.submitTransaction(tx);
    return res;
  }

  async detach(owner: string, tokenId: number, params: { sender: string }): Promise<Receipt> {
    const tx = this.createTransaction({
      method: { name: 'detach', args: [`'${owner}`, `${tokenId}`] },
    });
    await tx.sign(params.sender);
    const res = await this.submitTransaction(tx);
    return res;
  }

  async mintToken(owner: string, tokenId: number, params: { sender: string }): Promise<Receipt> {
    const tx = this.createTransaction({
      method: { name: 'mint-token', args: [`'${owner}`, `${tokenId}`] },
    });
    await tx.sign(params.sender);
    const res = await this.submitTransaction(tx);
    return res;
  }
}
