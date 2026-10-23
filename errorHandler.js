/**
 * @name errorHandler
 *
 * @docs
 * ```specscript
 * module HTTP "https://presidium.services/docs/HTTP"
 *
 * errorHandler(error Error, request HTTP.Request, response HTTP.Response) -> ()
 * ```
 */
function errorHandler(error, request, response) {
  response.writeHead(error.code ?? 500, {
    "Content-Type": "text/plain",
  })
  response.end(error.stack)
}

module.exports = errorHandler
