/**
 * Presidium DB Client and Server may be freely distributed under the CFOSS license.
 */

require("rubico/global")
const HTTP = require("presidium/HTTP")
const DiskHashTable = require("presidium-db/DiskHashTable")
const DiskSortedHashTable = require("presidium-db/DiskSortedHashTable")
const databaseHandler = require("./databaseHandler")
const healthCheckHandler = require("./healthCheckHandler")
const notFoundHandler = require("./notFoundHandler")
const errorHandler = require("./errorHandler")

/**
 * @name DatabaseServer
 *
 * @docs
 * ```specscript
 * module http "https://nodejs.org/api/http.html"
 *
 * type HttpHandler(http.ClientRequest, http.ServerResponse) -> Promise<>|undefined
 *
 * new DatabaseServer(options {
 *   databasePath: string,
 *   delimiter: string,
 * }, ...handlers Arguments<HttpHandler>) -> server DatabaseServer
 * ```
 *
 * Presidium DatabaseServer class. Creates a database server.
 *
 * Arguments:
 *   * `options`
 *     * `databasePath` - `string` - the absolute path on the machine running the database server to the database files.
 *     * `delimiter` - `string` - a character or string that will separate chunks of data as they are sent to the database client. Defaults to the escape character "^[".
 *   * `handlers` - `Arguments<HttpHandler>` - HTTP handlers that process the request in order before it is processed by the database server.
 *
 * Return:
 *   * `server` - [`DatabaseServer`](/docs/DatabaseServer) - a DatabaseServer instance.
 *
 * ```javascript
 * const server = new DatabaseServer({
 *   databasePath: `${__dirname}/database`,
 * })
 *
 * server.listen(8080, () => {
 *   console.log("Database server listening on port 8080")
 * })
 * ```
 */
class DatabaseServer {
  constructor(options, ...handlers) {
    this.databasePath = options.databasePath
    this.delimiter = options.delimiter ?? ""
    this.handlers = handlers
    this.hts = new Map()

    const router = tryCatch(
      switchCase(
        request => request.path == "/health",
        healthCheckHandler,

        request => request.pathDepth == 2,
        curry.call(databaseHandler, this),

        notFoundHandler,
      ),
      errorHandler
    )

    const handler = all.series([
      ...this.handlers,
      request => {
        const { pathname } = new URL(`http://*${request.url}`)
        request.path = decodeURIComponent(
          pathname == "/" ? pathname
          : pathname.endsWith("/") ? pathname.slice(0, -1)
          : pathname
        )
        request.pathSegments = request.path.slice(1).split("/")
        request.pathDepth = request.pathSegments.length
      },
      router,
    ])

    this.server = HTTP.Server(handler)
  }

  async init() {
  }

  /**
   * @name listen
   *
   * @docs
   * ```specscript
   * listen(port number) -> undefined
   * listen(port number, callback function) -> undefined
   * ```
   *
   * Start the database server listening on the specified port with an optional callback function.
   *
   * Arguments:
   *   * `port` - `number` - the port on which the database server will listen.
   *   * `callback` - `function` - a callback function to call once the database server has started listening.
   *
   * Return:
   *   * `undefined`
   *
   * ```javascript
   * server.listen(8080)
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
   * close() -> undefined
   * ```
   *
   * Closes the database server.
   *
   * Arguments:
   *   * (none)
   *
   * Return:
   *   * `undefined`
   *
   * ```javascript
   * server.close()
   * ```
   */
  close() {
    for (const [tableName, ht] of this.hts) {
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
   *   initialLength: number,
   *   itemSize: number,
   *   resizeRatio: number,
   *   resizeFactor: number,
   * }) -> Promise<>
   * ```
   *
   * Registers a [DiskHashTable](/docs/DiskHashTable) instance with the database server. Initializes the specified table.
   *
   * Arguments:
   *   * `tableName` - `string` - the name of the registered DiskHashTable instance.
   *   * `config`
   *     * `initialLength` - `number` - the initial length of the disk hash table. Minimum value 1, maximum value `Math.floor(9007199254740991 / itemSize)`. Defaults to 1024.
   *     * `itemSize` - `number` - the size in bytes of each item (including internal item info, key, and value) stored on disk. Minimum value 17. Defaults to 524288.
   *     * `resizeRatio` - `number` - the ratio of number of items to table length at which to resize the disk hash table. Minimum value 0 (no resize), maximum value 1. Defaults to 0.
   *     * `resizeFactor` - `number` - the factor that is multiplied with the disk hash table's current length to determine the new table length on a resize.
   *
   * Return:
   *   * Empty promise.
   *
   * ```javascript
   * await server.registerDiskHashTable("Profile", {
   *   initialLength: 1073741824,
   *   itemSize: 4096,
   * })
   * ```
   */
  async registerDiskHashTable(tableName, config) {
    const tableOptions = filter({
      storagePath: `${this.databasePath}/${tableName}/storage`,
      headerPath: `${this.databasePath}/${tableName}/header`,
      initialLength: config.initialLength,
      itemSize: config.itemSize,
      resizeRatio: config.resizeRatio,
      resizeFactor: config.resizeFactor,
    }, __)

    const ht = new DiskHashTable(tableOptions)
    await ht.init()

    this.hts.set(tableName, ht)
  }

  /**
   * @name registerDiskSortedHashTable
   *
   * @docs
   * ```specscript
   * registerDiskSortedHashTable(tableName string, config {
   *   initialLength: number,
   *   itemSize: number,
   *   sortValueType: "string"|"number"|Array<"string"|"number">,
   *   resizeRatio: number,
   *   resizeFactor: number,
   *   degree: number,
   * }) -> Promise<>
   * ```
   *
   * Registers a [DiskSortedHashTable](/docs/DiskSortedHashTable) instance with the database server. Initializes the specified table.
   *
   * Arguments:
   *   * `tableName` - `string` - the name of the registered DiskSortedHashTable instance.
   *   * `config`
   *     * `initialLength` - `number` - the initial length of the disk sorted hash table. Minimum value 1, maximum value `Math.floor(9007199254740991 / itemSize)`. Defaults to 1024.
   *     * `itemSize` - `number` - the size in bytes of each item (including internal item info, key, value, and sortValue) stored on disk. Minimum value 54. Defaults to 524288.
   *     * `sortValueType` - `"string"|"number"|Array<"string"|"number">` - the type of the disk sorted hash table sort values. If this value is an array, the sort value will be treated as a composite sort value. A composite sort value has each element of the array compared in order.
   *     * `resizeRatio` - `number` - the ratio of number of items to table length at which to resize the disk sorted hash table. Minimum value 0 (no resize), maximum value 1. Defaults to 0.
   *     * `resizeFactor` - `number` - the factor that is multiplied with the disk sorted hash table's current length to determine the new table length on a resize.
   *     * `degree` - `number` - minimum value 2, defaults to 2 - defines the following parameters for the internal b-tree that organizes all of the items in the disk sorted hash table:
   *       * Minimum number of items per b-tree node: `degree - 1`
   *       * Maximum number of items per b-tree node: `(2 * degree) - 1`
   *       * Minimum number of children per b-tree node: `degree`
   *       * Maximum number of children per b-tree node: `2 * degree`
   *
   * Return:
   *   * Empty promise.
   *
   * ```javascript
   * await server.registerDiskHashTable("Profile", {
   *   initialLength: 1073741824,
   *   itemSize: 4096,
   * })
   * ```
   *
   * ## Optimizing the disk sorted hash table b-tree
   * The value of `degree` determines the structure of the internal b-tree of the disk sorted hash table. A higher value for `degree` results in a shorter b-tree and more items per b-tree node, while a lower value results in a taller b-tree and fewer items per b-tree node. The default value of 2 is good for any number of items.
   */
  async registerDiskSortedHashTable(tableName, config) {
    const tableOptions = filter({
      storagePath: `${this.databasePath}/${tableName}/storage`,
      headerPath: `${this.databasePath}/${tableName}/header`,
      initialLength: config.initialLength,
      itemSize: config.itemSize,
      sortValueType: config.sortValueType,
      degree: config.degree,
      resizeRatio: config.resizeRatio,
      resizeFactor: config.resizeFactor,
    }, __)

    const ht = new DiskSortedHashTable(tableOptions)
    await ht.init()

    this.hts.set(tableName, ht)
  }
}

module.exports = DatabaseServer
