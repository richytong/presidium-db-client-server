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
 * }, ...handlers Arguments<HttpHandler>) -> DatabaseLoadBalancer
 *
 * hash(
 *   tableName string,
 *   key string,
 *   serverAddresses number
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
 *     * `serverAddresses` - `Array<string>|Array<Array<string>>` - the server addresses to load balance.
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
    this.server.close()
    this.closed = true
  }

}

module.exports = DatabaseLoadBalancer
