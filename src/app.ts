import express from 'express'
import { RootRouter, AuthRouter, UsersRouter } from './routes'

const app = express()

app.enable('trust proxy')
app.disable('x-powered-by')

app.use('/', RootRouter)
app.use('/auth', AuthRouter)
app.use('/users', UsersRouter)

export default async function listen(port: number) {
  return new Promise((resolve, reject) => {
    app.listen(port, resolve)
  })
}
