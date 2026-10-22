/**
 * @name healthCheckHandler
 *
 * @docs
 * ```specscript
 * module HTTP "https://presidium.services/docs/HTTP"
 *
 * healthCheckHandler(request HTTP.Request, response HTTP.Response) -> ()
 * ```
 */
function healthCheckHandler(request, response) {
  response.writeHead(200, {
    'Content-Type': 'text/plain',
  })
  response.end('OK')
}

module.exports = healthCheckHandler
