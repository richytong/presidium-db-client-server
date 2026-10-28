# Presidium DB Client and Server
![presidium](https://rubico.land/assets/presidium-logo-3-w200.jpg)

Source code: [GitHub](https://github.com/richytong/presidium-db-client-server) |
License: [CFOSS](https://cloutsworld.com/en-us/legal/license/cfoss)

![Node.js CI](https://github.com/richytong/presidium-db-client-server/workflows/Node.js%20CI/badge.svg)
[![codecov](https://codecov.io/gh/richytong/presidium-db-client-server/graph/badge.svg?token=07P6G8GIOQ)](https://codecov.io/gh/richytong/presidium-db-client-server)
[![npm version](https://img.shields.io/npm/v/presidium-db-client-server.svg?style=flat)](https://www.npmjs.com/package/presidium-db-client-server)

Presidium DB client and server.

## Host your own distributed database
```javascript
const DatabaseServer = require("presidium/DatabaseServer")

const server = new DatabaseServer({
  databasePath: `${__dirname}/database`,
})
await server.init()

await server.registerDiskHashTable("Session", {
  storagePath: `${this.databasePath}/Session/storage`,
  headerPath: `${this.databasePath}/Session/header`,
  initialLength: 536870912,
  itemSize: 512,
})

await server.registerDiskSortedHashTable("Post", {
  storagePath: `${this.databasePath}/Post/storage`,
  headerPath: `${this.databasePath}/Post/header`,
  initialLength: 1048576,
  itemSize: 8192,
  sortValueType: "number",
  degree: 2,
})

server.listen(5000, () => {
  console.log("Database server listening on port 5000")
})
```

## Call a database table from anywhere
```javascript
const DiskHashTableClient = require("presidium/DiskHashTableClient")

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

## Query a database table from anywhere
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

## Load balance your distributed database
```javascript
const DatabaseLoadBalancer = require("presidium/DatabaseLoadBalancer")

const loadBalancer = new DatabaseLoadBalancer({
  serverIps: ["10.0.0.1:8080", "10.0.0.2:8080"],
})

loadBalancer.listen(6333, () => {
  console.log("Database load balancer listening on port 6333")
})
```

## Installation

with [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm):
```bash
npm i presidium-db-client-server
```

## License
Presidium DB Client and Server is distributed under the [CFOSS License](https://cloutsworld.com/en-us/legal/license/cfoss).

## Support
 * minimum Node.js version: 16
