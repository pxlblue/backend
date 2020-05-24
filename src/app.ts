import express from 'express'
import {
  RootRouter,
  AuthRouter,
  UsersRouter,
  UploadRouter,
  ProxyRouter,
} from './routes'
import cors from 'cors'
const app = express()

app.enable('trust proxy')
app.disable('x-powered-by')

app.use(cors())

app.use('/', RootRouter)
app.use('/auth', AuthRouter)
app.use('/users', UsersRouter)
app.use('/upload', UploadRouter)
app.use('/proxy', ProxyRouter)

export default async function listen(port: number) {
  return new Promise((resolve, reject) => {
    app.listen(port, resolve)
  })
}
