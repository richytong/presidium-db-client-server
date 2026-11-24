/**
 * Presidium DB Client and Server may be freely distributed under the CFOSS license.
 */

require("rubico/global")
const HTTP = require("presidium/HTTP")
const loadBalancerHandler = require("./loadBalancerHandler")
const healthCheckHandler = require("./healthCheckHandler")
const notFoundHandler = require("./notFoundHandler")
const errorHandler = require("./errorHandler")
const defaultHash = require("./hash")

/**
 * @name DatabaseLoadBalancer
 *
 * @docs
 * ```specscript
 * module http "https://nodejs.org/api/http.html"
 *
 * type HttpHandler(http.ClientRequest, http.ServerResponse) -> Promise<>|undefined
 *
 * new DatabaseLoadBalancer(options {
 *   serverAddresses: Array<string>|Array<Array<string>>,
 * }, ...handlers Arguments<HttpHandler>) -> server DatabaseLoadBalancer
 *
 * hash(
 *   tableName string,
 *   key string,
 *   serverAddressesLength number
 * ) -> serverIndex Promise|number
 *
 * new DatabaseLoadBalancer(hash, options {
 *   serverAddresses: Array<string>|Array<Array<string>>,
 * }, ...handlers Arguments<HttpHandler>) -> DatabaseLoadBalancer
 * ```
 *
 * Presidium DatabaseLoadBalancer class. Creates a database load balancer server.
 *
 * Arguments:
 *   * `options`
 *     * `serverAddresses` - `Array<string>|Array<Array<string>>` - the server addresses to load balance. An array of arrays of server addresses means the request data should be replicated across the array of server addresses indicated by the hash function.
 *
 * Return:
 *   * `server` - [`DatabaseLoadBalancer`](/docs/DatabaseLoadBalancer) - a DatabaseLoadBalancer instance.
 *
 * ```javascript
 * const server = new DatabaseLoadBalancer({
 *   serverAddresses: ["10.0.0.1:8080", "10.0.0.2:8080", "10.0.0.3:8080"],
 * })
 *
 * server.listen(8080, () => {
 *   console.log("Database load balancer server listening on port 8080")
 * })
 * ```
 */
class DatabaseLoadBalancer {
  constructor(hash, options, ...handlers) {
    if (typeof hash == "function") {
      this.hash = hash
    } else {
      this.hash = defaultHash
      handlers.shift(options)
      options = hash
    }
    this.serverAddresses = options.serverAddresses ?? options.serverAddresses
    this.handlers = handlers
    this.clients = new Map()
    this.closed = false

    const router = tryCatch(
      switchCase(
        request => request.path == "/health",
        healthCheckHandler,

        request => request.pathDepth == 2,
        curry.call(loadBalancerHandler, this),

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

  /**
   * @name listen
   *
   * @docs
   * ```specscript
   * listen(port number) -> undefined
   * listen(port number, callback function) -> undefined
   * ```
   *
   * Start the database load balancer server listening on the specified port with an optional callback function.
   *
   * Arguments:
   *   * `port` - `number` - the port on which the database load balancer server will listen.
   *   * `callback` - `function` - a callback function to call once the database load balancer server has started listening.
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
   * Closes the database load balancer server.
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
    this.server.close()
    this.closed = true
  }

}

module.exports = DatabaseLoadBalancer
