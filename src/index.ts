import 'reflect-metadata'
import { config } from 'dotenv'
import { createConnection } from 'typeorm'
require('express-async-errors')
config()
import listen from './app'
import { registerFonts } from './images'

registerFonts()

createConnection({
  type: 'postgres',
  host: process.env.TYPEORM_HOST,
  username: process.env.TYPEORM_USERNAME,
  password: process.env.TYPEORM_PASSWORD,
  database: process.env.TYPEORM_DATABASE,
  synchronize: true,
  logging: false,
  entities: [__dirname + '/database/entities/**/*.{ts,js}'],
  migrations: [__dirname + '/database/migrations/**/*.{ts,js}'],
  subscribers: [__dirname + '/database/subscribers/**/*.{ts,js}'],
}).then(() => {
  console.log('connected to db')
  listen(parseInt(process.env.PORT!)).then(() => {
    console.log('listening on port', process.env.PORT)
  })
})
