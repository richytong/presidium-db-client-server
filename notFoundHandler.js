/**
 * @name notFoundHandler
 *
 * @docs
 * ```specscript
 * module HTTP "https://presidium.services/docs/HTTP"
 *
 * notFoundHandler(request HTTP.Request, response HTTP.Response) -> ()
 * ```
 */
function notFoundHandler(request, response) {
  response.writeHead(404, {
    "Content-Type": "text/plain",
  })
  response.end("Not Found")
}

module.exports = notFoundHandler
