/**
 * Presidium DB Client and Server may be freely distributed under the CFOSS license.
 */

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
   * clear() -> Promise<>
   * ```
   */
  async clear() {
    const response = await this.http.POST(`/${this.tableName}/clear`, {
      headers: {
        "Content-Type": "text/plain",
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
   * set(key string, value string|Buffer|Uint8Array) -> Promise<>
   * ```
   */
  async set(key, value) {
    const response = await this.http.POST(`/${this.tableName}/set`, {
      headers: {
        "Content-Type": Buffer.isBuffer(value)
          ? "application/octet-stream"
          : "text/plain",
        "Client-Name": "DiskHashTableClient",
        "Key": key,
      },
      body: value,
    })
    await handleServerResponse(response)
  }

  /**
   * @name get
   *
   * @docs
   * ```specscript
   * get(key string) -> value Promise<string|undefined>
   * ```
   */
  async get(key) {
    const response = await this.http.POST(`/${this.tableName}/get`, {
      headers: {
        "Content-Type": "text/plain",
        "Client-Name": "DiskHashTableClient",
        "Key": key,
      },
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
   * getBinary(key string) -> binaryValue Promise<Buffer|undefined>
   * ```
   */
  async getBinary(key) {
    const response = await this.http.POST(`/${this.tableName}/getBinary`, {
      headers: {
        "Content-Type": "text/plain",
        "Client-Name": "DiskHashTableClient",
        "Key": key,
      },
    })
    return handleServerResponse(response)
  }

  /**
   * @name delete
   *
   * @docs
   * ```specscript
   * delete(key string) -> didDelete Promise<boolean>
   * ```
   */
  async delete(key) {
    const response = await this.http.POST(`/${this.tableName}/delete`, {
      headers: {
        "Content-Type": "text/plain",
        "Client-Name": "DiskHashTableClient",
        "Key": key,
      },
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
        "Content-Type": "text/plain",
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
   * iterator() -> values AsyncGenerator<string>
   *
   * iterator(options {
   *   valueType: "string"|"binary",
   * }) -> values AsyncGenerator<string|Buffer>
   * ```
   */
  async * iterator(options = {}) {
    const { valueType } = options
    const response = await this.http.POST(`/${this.tableName}/iterator`, {
      headers: {
        "Content-Type": "text/plain",
        "Client-Name": "DiskHashTableClient",
        ...valueType ? { "Value-Type": valueType } : {},
      },
    })
    if (valueType == "binary") {
      yield * await handleServerResponse(response, {
        binaryStream: true,
        delimiter: this.delimiter,
      })
    } else {
      yield * await handleServerResponse(response, {
        textStream: true,
        delimiter: this.delimiter,
      })
    }
  }

  /**
   * @name entriesIterator
   *
   * @docs
   * ```specscript
   * entriesIterator() -> entries AsyncGenerator<[key string, value string]>
   *
   * entriesIterator(options {
   *   valueType: "string"|"binary",
   * }) -> entries AsyncGenerator<[key string, value string|Buffer]>
   * ```
   */
  async * entriesIterator(options = {}) {
    const { valueType } = options
    const response = await this.http.POST(`/${this.tableName}/entriesIterator`, {
      headers: {
        "Content-Type": "text/plain",
        "Client-Name": "DiskHashTableClient",
        ...valueType ? { "Value-Type": valueType } : {},
      },
    })

    if (valueType == "binary") {
      const iter = await handleServerResponse(response, {
        binaryEntriesStream: true,
        delimiter: this.delimiter,
        entryLength: 2,
      })
      yield* map(iter, curry.arity(4, buffersToEntry, __, 2, "utf8", valueType))
    } else {
      const iter = await handleServerResponse(response, {
        textEntriesStream: true,
        delimiter: this.delimiter,
        entryLength: 2,
      })
      yield* map(iter, curry.arity(4, buffersToEntry, __, 2, "utf8", valueType))
    }
  }
}

module.exports = DiskHashTableClient
