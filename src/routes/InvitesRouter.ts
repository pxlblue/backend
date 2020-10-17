import express from 'express'

import {
  authMiddleware,
  userIsAdmin,
  userIsModerator,
} from '../util/Middleware'
import { Invite } from '../database/entities/Invite'
import bodyParser from 'body-parser'
import { User } from '../database/entities/User'
import { randomBytes } from '../util/RandomUtil'
import { LessThanOrEqual } from 'typeorm'

const InvitesRouter = express.Router()

InvitesRouter.use(bodyParser.json())

InvitesRouter.use(authMiddleware())

InvitesRouter.route('/').get(userIsAdmin(), async (req, res) => {
  let limit = 50
  let page = 0
  if (req.query && req.query.limit) {
    limit = parseInt(req.query.limit as string)
  }
  if (req.query && req.query.page) {
    page = parseInt(req.query.page as string)
  }
  page = page * limit

  let invites = await Invite.find({
    order: {
      id: 'ASC',
    },
    take: limit,
    skip: page,
  })
  let count = await Invite.count()
  return res.status(200).json({
    success: true,
    message: 'invites',
    invites: invites.map((invite) => invite.serialize()),
    total: count,
    page: page,
    pages: Math.ceil(count / limit) - 1,
  })
})

InvitesRouter.route('/wave').post(userIsAdmin(), async (req, res) => {
  let maxUid = parseInt((req.body.maxUid as string) || '10000')
  let users = await User.find({
    where: {
      id: LessThanOrEqual(maxUid),
    },
  })
  users.forEach(async (user) => {
    let invite = new Invite()
    invite.invite = randomBytes(20)
    invite.createdAt = new Date()
    invite.creator = user.id
    await invite.save()
  })
  return res.json({
    success: true,
    message: `started invite wave for uid < ${maxUid}`,
  })
})

InvitesRouter.route('/create').post(userIsModerator(), async (req, res) => {
  let invite = new Invite()
  invite.invite = randomBytes(20)
  invite.createdAt = new Date()
  invite.creator = req.user.id
  invite.type = req.body.type
  if (invite.type > 3)
    // Max = 3
    invite.type = 0
  invite.params = req.body.params
  await invite.save()

  return res.status(200).json({ success: true, invite: invite.serialize() })
})

export default InvitesRouter
