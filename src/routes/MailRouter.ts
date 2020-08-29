import express from 'express'

import { authMiddleware, userIsAdmin } from '../util/Middleware'
import { Invite } from '../database/entities/Invite'
import { randomBytes } from '../util/RandomUtil'
import { User } from '../database/entities/User'
import bodyParser from 'body-parser'
import mailDb from '../mail'
import { RowDataPacket } from 'mysql2'

const MailRouter = express.Router()

MailRouter.use(bodyParser.json())

MailRouter.use(authMiddleware())

MailRouter.route('/create').post(async (req, res) => {
  if (!req.user.mailAccess) {
    return res.status(401).json({
      success: false,
      errors: [
        'you do not have mail access at this time. please purchase at pxl.blue',
      ],
    })
  }
  if (req.user.mailAccountCreated) {
    return res.status(400).json({
      success: false,
      errors: [
        'your mail account already exists. please contact an admin if you believe this to be in error.',
      ],
    })
  }

  if (await mailDb.mailboxExists(`${req.user.lowercaseUsername}@pxl.so`)) {
    return res.status(400).json({
      success: false,
      errors: [
        'there is already a mail account with your username registered. please contact an admin if you believe this to be in error.',
      ],
    })
  }
  await mailDb.createMailbox(
    `${req.user.lowercaseUsername}@pxl.so`,
    req.user.password
  )
  req.user.mailAccountCreated = true
  await req.user.save()
  return res.status(200).json({
    success: true,
    message: 'mailbox created',
  })
})

MailRouter.route('/resync_password').post(async (req, res) => {
  if (!req.user.mailAccess) {
    return res.status(401).json({
      success: false,
      errors: [
        'you do not have mail access at this time. please purchase at pxl.blue',
      ],
    })
  }
  if (!req.user.mailAccountCreated) {
    return res.status(400).json({
      success: false,
      errors: [
        'your mail account does not exist. please contact an admin if you believe this to be in error.',
      ],
    })
  }
  await mailDb.setPassword(
    `${req.user.lowercaseUsername}@pxl.so`,
    req.user.password
  )
  return res.status(200).json({
    success: true,
    message: 'password resynced successfully',
  })
})

export default MailRouter
