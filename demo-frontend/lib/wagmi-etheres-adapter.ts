import {
  Config,
  getConnectorClient,
  GetConnectorClientReturnType,
} from '@wagmi/core';
import { BrowserProvider, JsonRpcSigner } from 'ethers';

export function clientToSigner(
  client: GetConnectorClientReturnType<Config, number>
) {
  const { account, chain, transport } = client;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  console.log(
    'Creating signer with account:',
    account.address,
    'and chain:',
    network
  );
  const provider = new BrowserProvider(transport, network);
  const signer = new JsonRpcSigner(provider, account.address);
  return signer;
}

export function clientToEthersTransport(
  client: GetConnectorClientReturnType<Config, number>
) {
  return client.transport;
}

/** Action to convert a viem Wallet Client to an ethers.js Signer. */
export async function getEthersSigner(
  config: Config,
  { chainId }: { chainId?: number } = {}
) {
  const client = await getConnectorClient(config, { chainId });
  return clientToSigner(client);
}
