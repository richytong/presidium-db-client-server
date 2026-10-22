/**
 * Presidium DB Client and Server may be freely distributed under the CFOSS license.
 */

require("rubico/global")
const HTTP = require("HTTP")
const loadBalancerHandler = require("./loadBalancerHandler")
const healthCheckHandler = require("./healthCheckHandler")
const notFoundHandler = require("./notFoundHandler")
const errorHandler = require("./errorHandler")

/**
 * @name DatabaseLoadbalancer
 *
 * @docs
 * ```specscript
 * module HTTP "https://presidium.services/docs/HTTP"
 *
 * HTTP.Handler(HTTP.Request, HTTP.Response) -> ()
 *
 * new DatabaseLoadbalancer(
 *   hash(tableName string, key, string) -> Promise|number,
 *   options {
 *     serverIps: Array<string>,
 *   },
 *   ...handlers Arguments<HTTP.Handler>
 * )
 * ```
 */
class DatabaseLoadbalancer {
  constructor(hash, options, ...handlers) {
    this.serverIps = options.serverIps
    this.hash = hash
    this.https = new Map()

    const router = tryCatch(
      switchCase(
        request => request.path == "/health",
        healthCheckHandler,

        request => request.pathDepth == 2,
        curry.call(this, loadBalancerHandler),

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
}

module.exports = DatabaseLoadbalancer
