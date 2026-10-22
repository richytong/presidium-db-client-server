/**
 * Presidium DB Client and Server may be freely distributed under the CFOSS license.
 */

const HTTP = require("presidium/HTTP")
const DiskHashTable = require("presidium/DiskHashTable")
const DatabaseHandler = require("./DatabaseHandler")

/**
 * @name DatabaseServer
 *
 * @docs
 * ```specscript
 * new DatabaseServer(options {
 *   databasePath: string,
 *   manifestTableName: string,
 *   manifestTableInitialLength: number,
 *   manifestTableItemSize: number,
 *   defaultTableInitialLength: number,
 *   defaultTableItemSize: number,
 *   defaultDiskSortedHashTableDegree: number,
 * }) -> server DatabaseServer
 * ```
 */
class DatabaseServer {
  constructor(options) {
    this.databasePath = options.databasePath
    this.manifestTableName = options.manifestTableName ?? "Manifest"
    this.manifestTableInitialLength = options.manifestTableInitialLength ?? 1048576
    this.manifestTableItemSize = options.manifestTableItemSize ?? 1024
    this.defaultTableInitialLength = options.defaultTableInitialLength ?? 1048576
    this.defaultTableItemSize = options.defaultTableItemSize ?? 1024
    this.defaultDiskSortedHashTableDegree = options.defaultDiskSortedHashTableDegree ?? 2
    this.server = null
    this.hts = new Map()
  }

  /**
   * @name init
   *
   * @docs
   * ```specscript
   * init() -> Promise<>
   * ```
   */
  async init() {
    const manifestHt = new DiskHashTable({
      storagePath: `${this.databasePath}/${this.manifestTableName}/storage`,
      headerPath: `${this.databasePath}/${this.manifestTableName}/header`,
      initialLength: this.manifestTableInitialLength,
      itemSize: this.manifestTableItemSize,
    })
    await manifestHt.init()
    this.manifestHt = manifestHt

    const databaseHandler = DatabaseHandler({
      databasePath: this.databasePath,
      manifestTableName: this.manifestTableName,
      manifestTableInitialLength: this.manifestTableInitialLength,
      manifestTableItemSize: this.manifestTableItemSize,
      defaultTableInitialLength: this.defaultTableInitialLength,
      defaultTableItemSize: this.defaultTableItemSize,
      defaultDiskSortedHashTableDegree: this.defaultDiskSortedHashTableDegree,
      manifestHt: this.manifestHt,
      hts: this.hts,
    })

    this.server = HTTP.Server(databaseHandler)
  }

  /**
   * @name listen
   *
   * @docs
   * ```specscript
   * listen(port number) -> ()
   * listen(port number, callback function) -> ()
   * ```
   */
  listen(port, callback) {
    this.server.listen(port, callback)
  }

  /**
   * @name close
   *
   * @docs
   * ```specscript
   * close() -> ()
   * ```
   */
  close() {
    this.manifestHt.close()
    for (const ht of this.hts.values()) {
      ht.close()
    }
    this.server.close()
  }
}

module.exports = DatabaseServer
