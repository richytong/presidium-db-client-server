/**
 * Presidium DB Client and Server may be freely distributed under the CFOSS license.
 */

require("rubico/global")
const HTTP = require("presidium/HTTP")
const DiskHashTable = require("presidium/DiskHashTable")
const DiskSortedHashTable = require("presidium/DiskSortedHashTable")
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

    const handler = tryCatch(
      databaseHandler,
      function errorHandler(error, request, response) {
        response.writeHead(error.code ?? 500, {
          "Content-Type": "text/plain",
        })
        response.end(error.message)
      }
    )

    this.server = HTTP.Server(handler)
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

  /**
   * @name registerDiskHashTable
   *
   * @docs
   * ```specscript
   * registerDiskHashTable(tableName string, config {
   *   storagePath: string,
   *   headerPath: string,
   *   initialLength: number,
   *   itemSize: number,
   *   resizeRatio: number,
   *   resizeFactor: number,
   * }) -> Promise<>
   * ```
   */
  async registerDiskHashTable(tableName, config) {
    const ht = new DiskHashTable(config)
    await ht.init()
    await this.manifestHt.set(tableName, JSON.stringify(config))
    this.hts.set(tableName, ht)
  }

  /**
   * @name registerDiskSortedHashTable
   *
   * @docs
   * ```specscript
   * registerDiskSortedHashTable(tableName string, config {
   *   storagePath: string,
   *   headerPath: string,
   *   initialLength: number,
   *   itemSize: number,
   *   sortValueType: "number"|"string",
   *   degree: number,
   *   resizeRatio: number,
   *   resizeFactor: number,
   * }) -> Promise<>
   * ```
   */
  async registerDiskSortedHashTable(tableName, config) {
    const ht = new DiskSortedHashTable(config)
    await ht.init()
    await this.manifestHt.set(tableName, JSON.stringify(config))
    this.hts.set(tableName, ht)
  }
}

module.exports = DatabaseServer
