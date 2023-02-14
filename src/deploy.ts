import { use } from 'chai';
import { ContractFactory } from 'ethers';
import { WsProvider, Keyring } from '@polkadot/api';
import { evmChai, PolkaSigner, Signer, SignerProvider } from '@acala-network/bodhi';
import dotenv from 'dotenv';

import Factory from '../build/Factory.json';
import Forwarder from '../build/Forwarder.json';
import Token from '../build/Token.json';

dotenv.config();

const main = async () => {
  const endpoint = process.env.ENDPOINT ?? 'ws://localhost:9944';
  const provider = new SignerProvider({
    provider: new WsProvider(endpoint),
  });
  await provider.isReady();

  const seed = process.env.SEED ?? '//Alice';
  const keyring = new Keyring({ type: 'sr25519' });
  const pair = keyring.addFromUri(seed);

  const signer = new PolkaSigner(provider.api.registry, [pair]);
  const wallet = new Signer(provider, pair.address, signer);

  const token = await ContractFactory.fromSolidity(Token).connect(wallet).deploy(1000000000);
  // const token = ContractFactory.fromSolidity(Token).connect(wallet).attach('0x0230135fDeD668a3F7894966b14F42E65Da322e4');

  console.log('Deployed token', token.address)

  const factory = await ContractFactory.fromSolidity(Factory).connect(wallet).deploy();
  // const factory = ContractFactory.fromSolidity(Factory).connect(wallet).attach('0x546411ddd9722De71dA1B836327b37D840F16059');
  
  console.log('Deployed factory', factory.address)
  
  await provider.api.tx.utility.batch([
    provider.api.tx.evm.publishContract(token.address),
    provider.api.tx.evm.publishContract(factory.address),
  ]).signAndSend(pair)
  
  const receiver = '0x1234567890123456789012345678901234567890'

  const forwarder = await factory.callStatic.deploy(receiver);
  // const forwarder = '0xf73e99739520ff14CCda7B178Cd26A1FE5acDfE4';

  console.log('Forwarder address', forwarder)

  await token.transfer(forwarder, 1000000);

  console.log('Transferred 1000000 tokens to forwarder')

  await factory.deploy(receiver);

  console.log('Deployed forwarder')

  const bal = await token.balanceOf(forwarder);
  const bal2 = await token.balanceOf(receiver);

  console.log('Forwarder balance', bal.toString());
  console.log('Receiver balance', bal2.toString());

  const forwarderContract = ContractFactory.fromSolidity(Forwarder).attach(forwarder);
  await forwarderContract.connect(wallet).forward(token.address);

  console.log('Forwarder balance', bal.toString());
  console.log('Receiver balance', bal2.toString());

  process.exit(0)
};

main();
