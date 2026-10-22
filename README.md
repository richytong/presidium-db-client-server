# Presidium DB Client and Server
![presidium](https://rubico.land/assets/presidium-logo-3-w200.jpg)

Source code: [GitHub](https://github.com/richytong/presidium-websocket) |
License: [CFOSS](https://cloutsworld.com/en-us/legal/license/cfoss)

![Node.js CI](https://github.com/richytong/presidium-db-client-server/workflows/Node.js%20CI/badge.svg)
[![codecov](https://codecov.io/gh/richytong/presidium-db-client-server/graph/badge.svg?token=07P6G8GIOQ)](https://codecov.io/gh/richytong/presidium-db-client-server)
[![npm version](https://img.shields.io/npm/v/presidium-db-client-server.svg?style=flat)](https://www.npmjs.com/package/presidium-db-client-server)

Presidium DB Client and Server.

```javascript
const DatabaseServer = require("presidium-db-client-server/DatabaseServer")
const DiskHashTableClient = require("presidium-db-client-server/DiskHashTableClient")

const server = new DatabaseServer({
  databasePath: `${__dirname}/database`,
})
await server.init()

server.listen(5000, () => {
  console.log("Database server listening on port 5000")
})

const sessionHt = new DiskHashTableClient({
  serverUrl: "http://localhost:7357",
  tableName: "Session",
})

const accessToken = "token"
const session = { accessToken }

await sessionHt.set(accessToken, JSON.stringify(session))

const sessionJson = await sessionHt.get(accessToken)

await sessionHt.delete(accessToken)
```

## Docs
Coming soon.

## Installation

with [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm):
```bash
npm i presidium-db-client-server
```

## License
Presidium DB Client and Server is distributed under the [CFOSS License](https://cloutsworld.com/en-us/legal/license/cfoss).

## Support
 * minimum Node.js version: 16
