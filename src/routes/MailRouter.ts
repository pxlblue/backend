import express from 'express'

import { authMiddleware, userIsAdmin } from '../util/Middleware'
import bodyParser from 'body-parser'
import mailDb from '../mail'
import moment from 'moment'
const valid_username_regex = /^[a-z0-9\-]+$/i
const blacklisted_domains = ['pxl.so', 'whistler', 'whistler.blizzard.to']
// mostly RFC2142
const blacklisted_usernames = [
  'admin',
  'support',
  'abuse',
  'dmca',
  'copyright',
  'postmaster',
  'webmaster',
  'hostmaster',
  'info',
  'marketing',
  'sales',
  'usenet',
  'news',
  'www',
  'uucp',
  'ftp',
  'relative',
  'r',
]
const MailRouter = express.Router()

MailRouter.use(bodyParser.json())

MailRouter.use(authMiddleware())

MailRouter.use(async (req, res, next) => {
  if (req.user.mailAccess && req.user.mailAccessExpires !== null) {
    if (moment().isAfter(req.user.mailAccessExpires)) {
      req.user.mailAccess = false
      await req.user.save()
      await mailDb.setPassword(
        `${req.user.lowercaseUsername}@pxl.so`,
        'nooooooooobad'
      )
    }
  }
  return next()
})

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

MailRouter.route('/alias').get(async (req, res) => {
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
  const aliases = await mailDb.getAliasesForDestination(
    `${req.user.lowercaseUsername}@pxl.so`
  )
  return res.status(200).json({
    success: true,
    message: 'aliases',
    aliases,
  })
})
MailRouter.route('/alias/create').post(async (req, res) => {
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
  let errors: string[] = []
  if (!req.body.username) {
    errors.push('please specify a username')
  }
  if (!req.body.domain) {
    errors.push('please specify a username')
  }
  if (errors.length > 0) return res.status(400).json({ success: false, errors })
  if (blacklisted_domains.includes(req.body.domain)) {
    return res.status(400).json({
      success: false,
      errors: [
        'domain is not available for alias creation (reason: blacklisted)',
      ],
    })
  }
  if (blacklisted_usernames.includes(req.body.username)) {
    return res.status(400).json({
      success: false,
      errors: ['requested username is blacklisted'],
    })
  }
  if (req.body.username.length <= 3) {
    return res.status(400).json({
      success: false,
      errors: ['username is not 3 characters or more'],
    })
  }
  if (!req.body.username.match(valid_username_regex))
    return res.status(400).json({
      success: false,
      errors: ['requested alias is not alphanumeric'],
    })
  let email = `${req.body.username}@${req.body.domain}`
  if (!(await mailDb.domainExists(req.body.domain)))
    return res.status(400).json({
      success: false,
      errors: [
        'domain is not available for alias creation (reason: does not exist)',
      ],
    })
  if (await mailDb.aliasExists(email))
    return res.status(400).json({
      success: false,
      errors: ['alias already exists'],
    })
  const aliases = await mailDb.getAliasesForDestination(
    `${req.user.lowercaseUsername}@pxl.so`
  )
  if (aliases.length >= req.user.mailAliasLimit) {
    return res.status(400).json({
      success: false,
      errors: [
        'reached mail alias limit. please upgrade your mail plan or contact an admin to raise your limit.',
      ],
    })
  }
  let domain = await mailDb.getDomain(req.body.domain)
  let dst = `${req.user.lowercaseUsername}@pxl.so`
  await mailDb.createAlias(domain, email, dst)
  res.json({
    success: true,
    message: `alias '${email}' created, redirecting to '${dst}'`,
  })
})

MailRouter.route('/virtual_domains').get(async (req, res) => {
  const domains = await mailDb.getDomains()
  res.status(200).json({ success: true, domains })
})

MailRouter.route('/create_domain').post(userIsAdmin(), async (req, res) => {
  try {
    if (!req.body.domain) throw new Error(`'domain' not in body`)
    await mailDb.createDomain(req.body.domain)
    return res.status(200).json({
      success: true,
      message: `domain '${req.body.domain}' created successfully`,
    })
  } catch (err) {
    return res.status(400).json({
      success: false,
      errors: [err.message],
    })
  }
})

export default MailRouter
