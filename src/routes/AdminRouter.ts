import express from 'express'
import bodyParser from 'body-parser'
import { User } from '../database/entities/User'
import argon2 from 'argon2'
import { randomBytes, randomPassword } from '../util/RandomUtil'
import { authMiddleware, userIsAdmin } from '../util/Middleware'
import geoip from 'geoip-lite'
import IPToASN from 'ip-to-asn'
import { Invite } from '../database/entities/Invite'

const ipASNClient = new IPToASN()
const AdminRouter = express.Router()
AdminRouter.use(bodyParser.json())
AdminRouter.use(authMiddleware())
AdminRouter.use(userIsAdmin())

async function lookupIp(ip: string): Promise<any> {
  return new Promise((resolve, reject) => {
    ipASNClient.query([ip], (err, res) => {
      if (err) return reject(err)
      resolve(res)
    })
  })
}

async function getUserFromReq(req: express.Request): Promise<User | undefined> {
  let user = await await User.findOne({ where: { id: req.params.id } })
  return user
}

AdminRouter.route('/users/search_by_name').post(async (req, res) => {
  let users = await User.createQueryBuilder('user')
    .where('user.username ILIKE :name', {
      name: `%${req.body.name}%`,
    })
    .getMany()

  return res.status(200).json({
    success: true,
    users: users
      .map((user) => ({ label: user.username, value: user.id }))
      .reverse(),
  })
})
AdminRouter.route('/users/search_by_email').post(async (req, res) => {
  let users = await User.createQueryBuilder('user')
    .where('user.email ILIKE :email', {
      email: `%${req.body.email}%`,
    })
    .getMany()

  return res.status(200).json({
    success: true,
    users: users
      .map((user) => ({ label: user.email, value: user.id }))
      .reverse(),
  })
})

AdminRouter.route('/users/:id')
  .get(async (req, res) => {
    let user = await getUserFromReq(req)
    if (!user)
      return res
        .status(404)
        .json({ success: false, errors: ['user not found'] })
    return res.status(200).json({ success: true, user: user.serialize() })
  })
  .patch(async (req, res) => {
    let user = await getUserFromReq(req)
    if (!user)
      return res
        .status(404)
        .json({ success: false, errors: ['user not found'] })
    if (typeof req.body.email === 'string') {
      user.email = req.body.email
      user.lowercaseEmail = req.body.lowercaseEmail
    }
    if (typeof req.body.emailVerified === 'boolean') {
      user.emailVerified = req.body.emailVerified
    }
    await user.save()
    return res.status(200).json({ success: true, user: user.serialize() })
  })

AdminRouter.route('/users/:id/reset_password').post(async (req, res) => {
  let user = await getUserFromReq(req)
  if (!user)
    return res.status(404).json({ success: false, errors: ['user not found'] })
  let pw = randomPassword()
  let hash = await argon2.hash(pw, { type: argon2.argon2id })
  user.password = hash
  await user.save()
  return res
    .status(200)
    .json({ success: true, password: pw, user: user.serialize() })
})

AdminRouter.route('/users/:id/ban').post(async (req, res) => {
  let user = await getUserFromReq(req)
  if (!user)
    return res.status(404).json({ success: false, errors: ['user not found'] })
  user.banned = true
  user.banReason = `${req.body.reason} ~${req.user.username}`
  await user.save()
  return res.status(200).json({ success: true, user: user.serialize() })
})
AdminRouter.route('/users/:id/unban').post(async (req, res) => {
  let user = await getUserFromReq(req)
  if (!user)
    return res.status(404).json({ success: false, errors: ['user not found'] })
  user.banned = false
  user.banReason = `${user.banReason}\n\nUnbanned by: ${req.user.username}`
  await user.save()
  return res.status(200).json({ success: true, user: user.serialize() })
})

AdminRouter.route('/users/:id/ips').get(async (req, res) => {
  let user = await getUserFromReq(req)
  if (!user)
    return res.status(404).json({ success: false, errors: ['user not found'] })

  let ips = user.usedIps.map((ip) => ({
    ip: ip,
    loc: geoip.lookup(ip),
    asn: {},
  }))
  ips = await Promise.all(
    ips.map(async (obj) => {
      let lookup = await lookupIp(obj.ip)
      obj.asn = lookup[obj.ip]
      return obj
    })
  )
  return res.status(200).json({ success: true, ips })
})

AdminRouter.route('/users/:id/invites')
  .get(async (req, res) => {
    let user = await getUserFromReq(req)
    if (!user)
      return res
        .status(404)
        .json({ success: false, errors: ['user not found'] })

    let invites = await Invite.find({
      order: {
        id: 'DESC',
      },
      where: {
        creator: user.id,
      },
    })

    return res.status(200).json({
      success: true,
      invites: invites.map((invite) => invite.serialize()),
    })
  })
  .post(async (req, res) => {
    let user = await getUserFromReq(req)
    if (!user)
      return res
        .status(404)
        .json({ success: false, errors: ['user not found'] })

    let count = req.body.count || 1
    let invites = []
    for (let i = 0; i < count; i++) {
      let invite = new Invite()
      invite.invite = randomBytes(20)
      invite.createdAt = new Date()
      invite.creator = user.id
      await invite.save()
      invites.push(invite)
    }
    return res.status(200).json({
      success: true,
      invites: invites.map((invite) => invite.serialize()),
    })
  })

export default AdminRouter
