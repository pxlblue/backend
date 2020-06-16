import express from 'express'

import { authMiddleware, userIsAdmin } from '../util/Middleware'
import { Invite } from '../database/entities/Invite'
import bodyParser from 'body-parser'

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

export default InvitesRouter
