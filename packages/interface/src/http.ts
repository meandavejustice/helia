/**
 * @packageDocumentation
 *
 * The API defined by a {@link HeliaHTTP} node
 *
 * @example
 *
 * ```typescript
 * import type { HeliaHTTP } from '@helia/interface'
 *
 * export function doSomething(heliaHTTP: HeliaHTTP) {
 *   // use heliaHTTP node functions here
 * }
 * ```
 */

import type { Blocks } from './blocks.js'
import type { Pins } from './pins.js'
import type { AbortOptions, ComponentLogger } from '@libp2p/interface'
import type { Datastore } from 'interface-datastore'
import type { CID } from 'multiformats/cid'
import type { ProgressEvent, ProgressOptions } from 'progress-events'

export type { Await, AwaitIterable } from 'interface-store'

/**
 * The API presented by a Helia node.
 */
export interface HeliaHTTP {

  /**
   * Where the blocks are stored
   */
  blockstore: Blocks

  /**
   * A key/value store
   */
  datastore: Datastore

  /**
   * Pinning operations for blocks in the blockstore
   */
  pins: Pins

  /**
   * A logging component that can be reused by consumers
   */
  logger: ComponentLogger

  /**
   * Starts the HeliaHTTP node
   */
  start(): Promise<void>

  /**
   * Stops the HeliaHTTP node
   */
  stop(): Promise<void>

  /**
   * Remove any unpinned blocks from the blockstore
   */
  gc(options?: GCOptions): Promise<void>
}

export type GcEvents =
  ProgressEvent<'heliaHTTP:gc:deleted', CID> |
  ProgressEvent<'heliaHTTP:gc:error', Error>

export interface GCOptions extends AbortOptions, ProgressOptions<GcEvents> {

}
