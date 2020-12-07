import express from 'express'
import {
  RootRouter,
  AdminRouter,
  AuthRouter,
  UsersRouter,
  UploadRouter,
  ImagesRouter,
  InvitesRouter,
  MailRouter,
  DiscordRouter,
  DomainRouter,
  VoucherRouter,
  MatrixRouter,
} from './routes'
import cors from 'cors'
import os from 'os'
import { createLogger } from '@logdna/logger'
import morgan from 'morgan'
const app = express()

app.disable('x-powered-by')

const hostname = os.hostname()
const logger = createLogger(process.env.LOGDNA_INGESTION_KEY!, {
  hostname,
})

logger.on('error', (...args) => {
  console.error(
    'some error occurred with LogDNA and we caught it so this shit doesnt kill itself'
  )
})

const stream = {
  write: (message: any) => {
    //console.log(message)
    //logger.info(message)
  },
}

app.use((req, res, next) => {
  let ip = req.headers['cf-connecting-ip'] as string
  req.realIp = ip || req.ip

  res.header('X-Server-Hostname', hostname)
  return next()
})
morgan.token(
  'realip',
  (req: express.Request, res: express.Response) => req.realIp
)
app.use(
  morgan(
    ':realip - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"',
    {
      stream,
    }
  )
)

app.use(cors())

app.use('/', RootRouter)
app.use('/admin', AdminRouter)
app.use('/auth', AuthRouter)
app.use('/users', UsersRouter)
app.use('/images', ImagesRouter)
app.use('/invites', InvitesRouter)
app.use('/upload', UploadRouter)
app.use('/mail', MailRouter)
app.use('/discord', DiscordRouter)
app.use('/domains', DomainRouter)
app.use('/voucher', VoucherRouter)
app.use('/matrix', MatrixRouter)

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
      errors: [err.toString()],
      stack: err.stack,
    })
  }
)

export default async function listen(port: number) {
  return new Promise((resolve, reject) => {
    app.listen(port, resolve)
  })
}
