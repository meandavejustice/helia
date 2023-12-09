import { circuitRelayTransport } from '@libp2p/circuit-relay-v2'
import { identify } from '@libp2p/identify'
import { webSockets } from '@libp2p/websockets'
import * as Filters from '@libp2p/websockets/filters'
import { trustlessGateway } from '@helia/block-brokers'
import { createHeliaHTTP as createNode } from '../../src/index.js'
import type { Helia } from '@helia/interface'


// TODO: what does this look like with no libp2p?
// Keeping around temporarily as a reference, incase I need to stub out a fake libp2p in 
// order to get heliaHTTP working,
export async function createHelia (): Promise<Helia> {
  return createNode({
    blockBrokers: [
      trustlessGateway()
    ],
    libp2p: {
      addresses: {
        listen: [
          `${process.env.RELAY_SERVER}/p2p-circuit`
        ]
      },
      transports: [
        webSockets({
          filter: Filters.all
        }),
        circuitRelayTransport()
      ],
      connectionGater: {
        denyDialMultiaddr: async () => false
      },
      services: {
        identify: identify()
      }
    }
  })
}
