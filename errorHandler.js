/**
 * @name errorHandler
 *
 * @docs
 * ```coffeescript [specscript]
 * errorHandler(
 *   error Error,
 *   request http.ClientRequest,
 *   response http.ServerResponse
 * ) -> undefined
 * ```
 */
function errorHandler(error, request, response) {
  console.error(error)
  if (typeof error.code != "number") {
    error.code = 500
  }
  response.writeHead(error.code, {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "text/plain",
  })
  response.end(error.message)
}

module.exports = errorHandler
