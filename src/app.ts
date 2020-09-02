import express from 'express'
import {
  RootRouter,
  AuthRouter,
  UsersRouter,
  UploadRouter,
  ProxyRouter,
  ImagesRouter,
  InvitesRouter,
  MailRouter,
  DiscordRouter,
  DomainRouter,
} from './routes'
import cors from 'cors'
import os from 'os'
import 'express-async-errors'
const app = express()

app.disable('x-powered-by')

const hostname = os.hostname()
app.use((req, res, next) => {
  let ip = req.headers['cf-connecting-ip'] as string
  req.realIp = ip || req.ip

  res.header('X-Server-Hostname', hostname)
  return next()
})

app.use(cors())

app.use('/', RootRouter)
app.use('/auth', AuthRouter)
app.use('/users', UsersRouter)
app.use('/images', ImagesRouter)
app.use('/invites', InvitesRouter)
app.use('/upload', UploadRouter)
app.use('/mail', MailRouter)
app.use('/proxy', ProxyRouter)
app.use('/discord', DiscordRouter)
app.use('/domains', DomainRouter)

app.use((req, res, next) => {
  return res.status(404).json({
    success: false,
    errors: ['page not found'],
  })
})

app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    return res.status(500).json({
      success: false,
      message: 'internal server error',
      errors: [err.stack || err.toString()],
    })
  }
)

export default async function listen(port: number) {
  return new Promise((resolve, reject) => {
    app.listen(port, resolve)
  })
}
