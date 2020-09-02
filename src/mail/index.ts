import mysql, {
  Connection,
  Pool,
  PoolConnection,
  RowDataPacket,
} from 'mysql2/promise'

const pool = mysql.createPool({
  host: process.env.MAIL_HOST,
  user: process.env.MAIL_USER,
  password: process.env.MAIL_PASS,
  database: process.env.MAIL_DB,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

class MailDb {
  connection: PoolConnection
  constructor(pool: Pool) {
    this.init(pool)
  }
  async init(pool: Pool) {
    this.connection = await pool.getConnection()
  }
  async mailboxExists(email: string) {
    const [
      results,
    ] = await this.connection.execute(
      'SELECT * FROM `virtual_users` WHERE `email` = ?;',
      [email]
    )
    return (results as RowDataPacket[][]).length > 0
  }
  async createMailbox(email: string, password: string) {
    await this.connection.execute(
      'INSERT INTO `virtual_users`(`domain_id`, `email`, `password`) VALUES(?, ?, ?);',
      [1, email, password]
    )
  }
  async setPassword(email: string, password: string) {
    await this.connection.execute(
      'UPDATE `virtual_users` SET `password` = ? WHERE `email` = ?;',
      [password, email]
    )
  }
  async domainExists(domain: string) {
    const [
      results,
    ] = await this.connection.execute(
      'SELECT * FROM `virtual_domains` WHERE `name` = ?;',
      [domain]
    )
    return (results as RowDataPacket[][]).length > 0
  }
  async getDomains() {
    const [results] = await this.connection.execute(
      'SELECT * FROM `virtual_domains` WHERE `name` != "pxl.so" AND `name` != "whistler.blizzard.to" AND `name` != "whistler";'
    )
    let r = results as RowDataPacket[]
    return r.map((row) => row.name)
  }
  async getDomain(domain: string): Promise<number> {
    const [
      results,
    ] = await this.connection.execute(
      'SELECT * FROM `virtual_domains` WHERE `name` = ?;',
      [domain]
    )
    let r = results as RowDataPacket[]
    return r[0].id
  }

  async aliasExists(email: string) {
    const [
      results,
    ] = await this.connection.execute(
      'SELECT * FROM `virtual_aliases` WHERE `source` = ?;',
      [email]
    )
    return (results as RowDataPacket[][]).length > 0
  }
  async createAlias(domainId: number, src: string, dst: string) {
    const [
      results,
    ] = await this.connection.execute(
      'INSERT INTO `virtual_aliases`(`domain_id`, `source`, `destination`) VALUES(?, ?, ?);',
      [domainId, src, dst]
    )
  }
  async getAliasesForDestination(dst: string) {
    const [
      results,
    ] = await this.connection.execute(
      'SELECT * FROM `virtual_aliases` WHERE `destination` = ?;',
      [dst]
    )
    const r = results as RowDataPacket[]
    return r.map((row) => row.source)
  }
  async createDomain(domain: string) {
    if (await this.domainExists(domain))
      throw new Error('domain already exists in database')
    const [
      results,
    ] = await this.connection.execute(
      'INSERT INTO `virtual_domains`(`name`) VALUES(?);',
      [domain]
    )
  }
}

const mailDb = new MailDb(pool)
export default mailDb
