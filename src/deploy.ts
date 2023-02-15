import { use } from "chai";
import { ContractFactory } from "ethers";
import { WsProvider, Keyring } from "@polkadot/api";
import { PolkaSigner, Signer, SignerProvider } from "@acala-network/bodhi";
import dotenv from "dotenv";

import Factory from "../build/Factory.json";
import Forwarder from "../build/Forwarder.json";
import Token from "../build/Token.json";

dotenv.config();

const main = async () => {
  const endpoint = process.env.ENDPOINT ?? "ws://localhost:9944";
  const provider = new SignerProvider({
    provider: new WsProvider(endpoint),
  });
  await provider.isReady();

  const seed = process.env.SEED ?? "//Alice";
  const keyring = new Keyring({ type: "sr25519" });
  const pair = keyring.addFromUri(seed);

  const signer = new PolkaSigner(provider.api.registry, [pair]);
  const wallet = new Signer(provider, pair.address, signer);

  const token = await ContractFactory.fromSolidity(Token)
    .connect(wallet)
    .deploy(1000000000);

  console.log("Deployed token", token.address);

  const factory = await ContractFactory.fromSolidity(Factory)
    .connect(wallet)
    .deploy();

  console.log("Deployed factory", factory.address);

  await new Promise((resolve) => {
    provider.api.tx.utility
      .batch([
        provider.api.tx.evm.publishContract(token.address),
        provider.api.tx.evm.publishContract(factory.address),
      ])
      .signAndSend(pair, ({ status }) => {
        if (status.isInBlock || status.isFinalized) {
          resolve(true);
        }
      });
  });

  const receiver = "0x1234567890123456789012345678901234567890";

  const forwarder = await factory.callStatic.deploy(receiver);

  console.log("Forwarder address", forwarder);

  await (await token.transfer(forwarder, 1000000)).wait();

  console.log("Transferred 1000000 tokens to forwarder");

  console.log(
    "Forwarder balance",
    (await token.balanceOf(forwarder)).toString()
  );
  console.log("Receiver balance", (await token.balanceOf(receiver)).toString());

  await (await factory.deployAndForward(receiver, token.address)).wait();
  
  console.log('trigger forward')

  // await (await factory.deploy(receiver)).wait();

  // const forwarderContract =
  //   ContractFactory.fromSolidity(Forwarder).attach(forwarder);
  // (await forwarderContract.connect(wallet).forward(token.address)).wait();

  console.log(
    "Forwarder balance",
    (await token.balanceOf(forwarder)).toString()
  );
  console.log("Receiver balance", (await token.balanceOf(receiver)).toString());

  process.exit(0);
};

main();
