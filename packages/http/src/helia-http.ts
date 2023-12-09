import drain from 'it-drain'
import { CustomProgressEvent } from 'progress-events'
import { trustlessGateway } from '@helia/block-brokers'
import { PinsImpl } from './pins.js'
import { BlockStorage } from './storage.js'
import { defaultHashers } from './utils/default-hashers.js'
import { NetworkedStorage } from '@helia/block-brokers/utils'
import type { HeliaHTTPInit } from './index.js'
import type { GCOptions, Helia } from '@helia/interface'
import type { Pins } from '@helia/interface/pins'
import type { ComponentLogger, Logger } from '@libp2p/interface'
import type { Blockstore } from 'interface-blockstore'
import type { Datastore } from 'interface-datastore'
import type { CID } from 'multiformats/cid'

interface HeliaImplInit extends HeliaHTTPInit {
  blockstore: Blockstore
  datastore: Datastore
}

interface HeliaHTTP extends Omit<Helia, 'start'|'stop'|'libp2p'> {}

export class HeliaHTTPImpl implements HeliaHTTP {
  public blockstore: BlockStorage
  public datastore: Datastore
  public pins: Pins
  public logger: ComponentLogger
  private readonly log: Logger

  constructor (init: HeliaImplInit) {
    this.logger = init.libp2p.logger
    this.log = this.logger.forComponent('helia')
    const hashers = defaultHashers(init.hashers)

    const components = {
      blockstore: init.blockstore,
      datastore: init.datastore,
      hashers,
      logger: init.libp2p.logger
    }

    const blockBrokers = init.blockBrokers?.map((fn) => {
      return fn(components)
    }) ?? [
      trustlessGateway()(components)
    ]

    const networkedStorage = new NetworkedStorage(components, {
      blockBrokers,
      hashers
    })

    this.pins = new PinsImpl(init.datastore, networkedStorage, init.dagWalkers ?? [])

    this.blockstore = new BlockStorage(networkedStorage, this.pins, {
      holdGcLock: init.holdGcLock
    })
    this.datastore = init.datastore
  }

  async gc (options: GCOptions = {}): Promise<void> {
    const releaseLock = await this.blockstore.lock.writeLock()

    try {
      const helia = this
      const blockstore = this.blockstore.unwrap()

      this.log('gc start')

      await drain(blockstore.deleteMany((async function * (): AsyncGenerator<CID> {
        for await (const { cid } of blockstore.getAll()) {
          try {
            if (await helia.pins.isPinned(cid, options)) {
              continue
            }

            yield cid

            options.onProgress?.(new CustomProgressEvent<CID>('helia:gc:deleted', cid))
          } catch (err) {
            helia.log.error('Error during gc', err)
            options.onProgress?.(new CustomProgressEvent<Error>('helia:gc:error', err))
          }
        }
      }())))
    } finally {
      releaseLock()
    }

    this.log('gc finished')
  }
}
