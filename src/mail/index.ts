import mysql, { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise'

class MailDb {
  pool: Pool
  constructor() {
    this.init()
  }
  async init() {
    this.pool = mysql.createPool({
      host: process.env.MAIL_HOST,
      user: process.env.MAIL_USER,
      password: process.env.MAIL_PASS,
      database: process.env.MAIL_DB,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    })
  }
  async connection(): Promise<PoolConnection> {
    return this.pool.getConnection()
  }

  async mailboxExists(email: string) {
    const connection = await this.connection()
    const [
      results,
    ] = await connection.execute(
      'SELECT * FROM `virtual_users` WHERE `email` = ?;',
      [email]
    )
    connection.release()
    return (results as RowDataPacket[][]).length > 0
  }
  async createMailbox(email: string, password: string) {
    const connection = await this.connection()
    await connection.execute(
      'INSERT INTO `virtual_users`(`domain_id`, `email`, `password`) VALUES(?, ?, ?);',
      [1, email, password]
    )
    connection.release()
  }
  async setPassword(email: string, password: string) {
    const connection = await this.connection()
    await connection.execute(
      'UPDATE `virtual_users` SET `password` = ? WHERE `email` = ?;',
      [password, email]
    )
    connection.release()
  }
  async domainExists(domain: string) {
    const connection = await this.connection()
    const [
      results,
    ] = await connection.execute(
      'SELECT * FROM `virtual_domains` WHERE `name` = ?;',
      [domain]
    )
    connection.release()
    return (results as RowDataPacket[][]).length > 0
  }
  async getDomains() {
    const connection = await this.connection()
    const [results] = await connection.execute(
      'SELECT * FROM `virtual_domains` WHERE `name` != "pxl.so" AND `name` != "mail.pxl.so" AND `name` != "mail";'
    )
    connection.release()
    let r = results as RowDataPacket[]
    return r.map((row) => row.name)
  }
  async getDomain(domain: string): Promise<number> {
    const connection = await this.connection()
    const [
      results,
    ] = await connection.execute(
      'SELECT * FROM `virtual_domains` WHERE `name` = ?;',
      [domain]
    )
    connection.release()
    let r = results as RowDataPacket[]
    return r[0].id
  }

  async aliasExists(email: string) {
    const connection = await this.connection()
    const [
      results,
    ] = await connection.execute(
      'SELECT * FROM `virtual_aliases` WHERE `source` = ?;',
      [email]
    )
    connection.release()
    return (results as RowDataPacket[][]).length > 0
  }
  async createAlias(domainId: number, src: string, dst: string) {
    const connection = await this.connection()
    const [
      results,
    ] = await connection.execute(
      'INSERT INTO `virtual_aliases`(`domain_id`, `source`, `destination`) VALUES(?, ?, ?);',
      [domainId, src, dst]
    )
    connection.release()
  }
  async getAliasesForDestination(dst: string) {
    const connection = await this.connection()
    const [
      results,
    ] = await connection.execute(
      'SELECT * FROM `virtual_aliases` WHERE `destination` = ?;',
      [dst]
    )
    connection.release()
    const r = results as RowDataPacket[]
    return r.map((row) => row.source)
  }
  async createDomain(domain: string) {
    if (await this.domainExists(domain))
      throw new Error('domain already exists in database')
    const connection = await this.connection()
    const [
      results,
    ] = await connection.execute(
      'INSERT INTO `virtual_domains`(`name`) VALUES(?);',
      [domain]
    )
    connection.release()
  }
}

const mailDb = new MailDb()
export default mailDb
