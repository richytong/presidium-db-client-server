# Presidium DB Client and Server
![presidium](https://rubico.land/assets/presidium-logo-3-w200.jpg)

Source code: [GitHub](https://github.com/richytong/presidium-websocket) |
License: [CFOSS](https://cloutsworld.com/en-us/legal/license/cfoss)

![Node.js CI](https://github.com/richytong/presidium-db-client-server/workflows/Node.js%20CI/badge.svg)
[![codecov](https://codecov.io/gh/richytong/presidium-db-client-server/graph/badge.svg?token=07P6G8GIOQ)](https://codecov.io/gh/richytong/presidium-db-client-server)
[![npm version](https://img.shields.io/npm/v/presidium-db-client-server.svg?style=flat)](https://www.npmjs.com/package/presidium-db-client-server)

Presidium DB Client and Server. Host your own distributed database.

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
  serverUrl: "http://localhost:5000",
  tableName: "Session",
})

const accessToken = "token"
const session = { accessToken }

await sessionHt.set(accessToken, JSON.stringify(session))

const sessionJson = await sessionHt.get(accessToken)

await sessionHt.delete(accessToken)
```

Query your distributed database.

```javascript
const DiskSortedHashTableClient = require("presidium-db-client-server/DiskSortedHashTableClient")

const postHt = new DiskSortedHashTableClient({
  serverUrl: "http://localhost:5000",
  tableName: "Post",
  sortValueType: "number",
})

const post1 = {
  id: "post-1",
  images: ["/assets/post-1/image-1.jpg"],
  content: "First post",
  time: Date.now(),
}

const post2 = {
  id: "post-2",
  images: ["/assets/post-2/image-2.jpg"],
  content: "Second post",
  time: Date.now(),
}

const post3 = {
  id: "post-3",
  images: ["/assets/post-3/image-3.jpg"],
  content: "Third post",
  time: Date.now(),
}

await postHt.set(post1.id, JSON.stringify(post1), post1.time)
await postHt.set(post2.id, JSON.stringify(post2), post2.time)
await postHt.set(post3.id, JSON.stringify(post3), post3.time)

const myPosts = []
for await (const postJson of postHt.reverseIterator()) {
  myPosts.push(JSON.parse(postJson))
}
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
