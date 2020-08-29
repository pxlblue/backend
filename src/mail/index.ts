import mysql from 'mysql2'
import { Connection, RowDataPacket } from 'mysql2/promise'

const conn = mysql.createConnection({
  host: process.env.MAIL_HOST,
  user: process.env.MAIL_USER,
  password: process.env.MAIL_PASS,
  database: process.env.MAIL_DB,
})
conn.connect((err) => {
  if (err) {
    console.error('failed to connect to mail db', err)
    process.exit(1)
  }
  console.log('connected to mail db')
})

class MailDb {
  connection: Connection
  constructor(connection: Connection) {
    this.connection = connection
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
}

const connection = conn.promise()
const mailDb = new MailDb(connection)
export default mailDb
