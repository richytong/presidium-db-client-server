require("rubico/global")
const HTTP = require("presidium/HTTP")
const Readable = require("presidium/Readable")
const handleServerResponse = require("./handleServerResponse")
const buffersToEntry = require("./buffersToEntry")

/**
 * @name DiskHashTableClient
 *
 * @docs
 * ```specscript
 * new DiskHashTableClient(options {
 *   serverUrl: string,
 *   tableName: string,
 *   delimiter: string,
 * }) -> DiskHashTableClient
 * ```
 */
class DiskHashTableClient {
  constructor(options) {
    this.serverUrl = options.serverUrl
    this.tableName = options.tableName
    this.delimiter = options.delimiter ?? ""
    this.http = new HTTP(this.serverUrl)
  }

  /**
   * @name clear
   *
   * @docs
   * ```specscript
   * module DiskHashTable "https://presidium.services/docs/DiskHashTable"
   *
   * clear DiskHashTable.clear
   * ```
   */
  async clear() {
    const response = await this.http.POST(`/${this.tableName}/clear`, {
      headers: {
        "Client-Name": "DiskHashTableClient",
      },
    })
    return handleServerResponse(response)
  }

  /**
   * @name set
   *
   * @docs
   * ```specscript
   * module DiskHashTable "https://presidium.services/docs/DiskHashTable"
   *
   * set DiskHashTable.set
   * ```
   */
  async set(key, value) {
    const response = await this.http.POST(`/${this.tableName}/set`, {
      headers: {
        "Content-Type": "application/json",
        "Client-Name": "DiskHashTableClient",
      },
      body: JSON.stringify({ key, value }),
    })
    await handleServerResponse(response)
  }

  /**
   * @name get
   *
   * @docs
   * ```specscript
   * module DiskHashTable "https://presidium.services/docs/DiskHashTable"
   *
   * get DiskHashTable.get
   * ```
   */
  async get(key) {
    const response = await this.http.POST(`/${this.tableName}/get`, {
      headers: {
        "Content-Type": "application/json",
        "Client-Name": "DiskHashTableClient",
      },
      body: JSON.stringify({ key }),
    })
    if (response.status == 499) {
      return undefined
    }
    return handleServerResponse(response)
  }

  /**
   * @name getBinary
   *
   * @docs
   * ```specscript
   * module DiskHashTable "https://presidium.services/docs/DiskHashTable"
   *
   * getBinary DiskHashTable.getBinary
   * ```
   */
  async getBinary(key) {
    const response = await this.http.POST(`/${this.tableName}/getBinary`, {
      headers: {
        "Content-Type": "application/json",
        "Client-Name": "DiskHashTableClient",
      },
      body: JSON.stringify({ key }),
    })
    return handleServerResponse(response)
  }

  /**
   * @name delete
   *
   * @docs
   * ```specscript
   * module DiskHashTable "https://presidium.services/docs/DiskHashTable"
   *
   * delete DiskHashTable.delete
   * ```
   */
  async delete(key) {
    const response = await this.http.POST(`/${this.tableName}/delete`, {
      headers: {
        "Content-Type": "application/json",
        "Client-Name": "DiskHashTableClient",
      },
      body: JSON.stringify({ key }),
    })
    const didDeleteText = await handleServerResponse(response)
    return didDeleteText == "true"
  }

  /**
   * @name count
   *
   * @docs
   * ```specscript
   * count() -> Promise<number>
   * ```
   */
  async count() {
    const response = await this.http.POST(`/${this.tableName}/count`, {
      headers: {
        "Client-Name": "DiskHashTableClient",
      },
    })
    const scount = await handleServerResponse(response)
    return Number(scount)
  }

  /**
   * @name iterator
   *
   * @docs
   * ```specscript
   * iterator(options {
   *   valueType: "string"|"binary",
   * }) -> values AsyncIterator<string|Buffer>
   * ```
   */
  async iterator(options = {}) {
    const { valueType } = options
    const response = await this.http.POST(`/${this.tableName}/iterator`, {
      headers: {
        "Content-Type": "application/json",
        "Client-Name": "DiskHashTableClient",
      },
      body: JSON.stringify(options),
    })
    if (valueType == "binary") {
      return handleServerResponse(response, {
        binaryStream: true,
        delimiter: this.delimiter,
      })
    }
    return handleServerResponse(response, {
      textStream: true,
      delimiter: this.delimiter,
    })
  }

  /**
   * @name entriesIterator
   *
   * @docs
   * ```specscript
   * entriesIterator(options {
   *   valueType: 'string'|'binary',
   * }) -> entries AsyncIterator<[key string, value string|Buffer]>
   * ```
   */
  async entriesIterator(options = {}) {
    const { valueType } = options
    const response = await this.http.POST(`/${this.tableName}/entriesIterator`, {
      headers: {
        "Content-Type": "application/json",
        "Client-Name": "DiskHashTableClient",
      },
      body: JSON.stringify({ valueType }),
    })

    if (valueType == "binary") {
      const iter = await handleServerResponse(response, {
        binaryEntriesStream: true,
        delimiter: this.delimiter,
        entryLength: 2,
      })
      return map(iter, curry.arity(4, buffersToEntry, __, 2, "utf8", valueType))
    }
    const iter = await handleServerResponse(response, {
      textEntriesStream: true,
      delimiter: this.delimiter,
      entryLength: 2,
    })
    return map(iter, curry.arity(4, buffersToEntry, __, 2, "utf8", valueType))
  }
}

module.exports = DiskHashTableClient
