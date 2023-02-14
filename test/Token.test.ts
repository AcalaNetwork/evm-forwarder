import { expect, use } from 'chai';
import { deployContract, solidity } from 'ethereum-waffle';
import { Contract, ContractFactory } from 'ethers';

import { evmChai, getTestUtils, Signer } from '@acala-network/bodhi';

import Token from '../build/ERC20.json';

use(solidity);
use(evmChai);


describe('Token', () => {
  let wallet: Signer;
  let walletTo: Signer;
  let token: Contract;

  before(async () => {
    const endpoint = process.env.ENDPOINT_URL ?? 'ws://localhost:9944';
    const { wallets } = await getTestUtils(endpoint);
    [wallet, walletTo] = wallets;
  });


});
