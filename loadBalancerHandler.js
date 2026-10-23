const HTTP = require("presidium/HTTP")

/**
 * @name loadBalancerHandler
 *
 * @docs
 * ```specscript
 * module HTTP "https://presidium.services/docs/HTTP"
 *
 * loadBalancerHandler(HTTP.Request, HTTP.Response) -> ()
 * ```
 */
async function loadBalancerHandler(request, response) {
  const tableName = request.pathSegments[0]
  const key = request.headers["key"]

  let index = this.hash(tableName, key, this.serverIps.length)
  if (typeof index.then == "function") {
    index = await index
  }

  const serverIp = this.serverIps[index]
  let client
  if (this.clients.has(serverIp)) {
    client = this.clients.get(serverIp)
  } else {
    client = new HTTP(serverIp)
    this.clients.set(serverIp, client)
  }

  console.log("loadBalancerHandler", serverIp, index, this.serverIps)

  const serverResponse = await client[request.method](request.url, {
    headers: request.headers,
    body: request,
  })

  console.log("loadBalancerHandler response", serverResponse.status, serverResponse.headers)

  response.writeHead(serverResponse.status, serverResponse.headers)
  serverResponse.pipe(response)
}

module.exports = loadBalancerHandler
