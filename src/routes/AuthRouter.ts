import express from 'express'
import { randomBytes, createSessionToken } from '../util/RandomUtil'
import { Session } from '../database/entities/Session'
import { User } from '../database/entities/User'
import argon2, { argon2id } from 'argon2'
import bodyParser from 'body-parser'
import moment from 'moment'
import {
  sendMail,
  verifyEmailTemplate,
  verifyEmailSuccessTemplate
} from '../util/MailUtil'
import { Invite, InviteType } from '../database/entities/Invite'

const valid_username_regex = /^[a-z0-9]+$/i
const email_regex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/

const AuthRouter = express.Router()

AuthRouter.use(bodyParser.json())

async function sendVerificationEmail(user: User) {
  return sendMail(
    user.email,
    '[pxl.blue] verify your email',
    verifyEmailTemplate(
      user.username,
      `https://api.pxl.blue/auth/verify_email?k=${user.emailVerificationToken}`
    )
  )
}

AuthRouter.route('/register').post(async (req, res) => {
  let errors = []
  if (!req.body) {
    errors.push('please supply a body')
  }
  if (!req.body.username) {
    errors.push('please supply a username')
  }
  if (!req.body.email) {
    errors.push('please supply an email')
  }
  if (!req.body.password) {
    errors.push('please supply a password')
  }
  if (!req.body.invite) {
    errors.push('please supply an invitation code')
  }
  if (req.body.password.length < 6) {
    errors.push('password must be longer than 6 characters')
  }
  if (!req.body.username.match(valid_username_regex)) {
    errors.push('username must be alphanumeric')
  }
  if (!req.body.email.match(email_regex)) {
    errors.push('email is not valid')
  }
  if (req.body.invite.length !== 40) {
    errors.push('invitation code is invalid')
  }
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'errors',
      errors,
    })
  }

  let users = await User.find({
    where: {
      lowercaseUsername: req.body.username.toLowerCase(),
    },
  })
  let emails = await User.find({
    where: {
      lowercaseEmail: req.body.email.toLowerCase(),
    },
  })
  if (users.length > 0) {
    errors.push('username is already in use!')
  }
  if (emails.length > 0) {
    errors.push('email is already in use!')
  }
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'errors',
      errors,
    })
  }

  let invite = null
  if (process.env.INVITES_DISABLED !== '1') {
    invite = await Invite.findOne({
      where: {
        invite: req.body.invite,
      },
    })
    if (!invite) {
      errors.push('invitation code is invalid')
    }
    if (invite && invite.redeemed) {
      errors.push('invitation code has already been redeemed')
    }
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'errors',
        errors,
      })
    }
    let creator = await User.findOne({
      where: {
        id: invite!.creator,
      },
    })
    if (!creator) {
      errors.push('the creator of that invite does not exist')
    }
    if (creator && creator.banned) {
      errors.push('your inviter is banned')
    }
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'errors',
        errors,
      })
    }
  }

  let user = new User()
  user.username = req.body.username
  user.email = req.body.email
  user.lowercaseUsername = user.username.toLowerCase()
  user.lowercaseEmail = user.email.toLowerCase()
  user.registrationDate = new Date()
  user.registrationIp = req.realIp
  user.usedIps = [user.registrationIp]
  user.uploadKey = randomBytes()
  user.emailVerificationToken = randomBytes()

  let hashedPassword = await argon2.hash(req.body.password, {
    type: argon2id,
  })
  user.password = hashedPassword
  await user.save()
  if (process.env.INVITES_DISABLED !== '1') {
    invite!.redeemed = true
    invite!.redeemedAt = new Date()
    invite!.redeemedBy = user.id
    invite!.redeemedByUsername = user.username
    await invite!.save()

    if (invite!.type === InviteType.LIMITED) {
      user.limited = true
      user.limitedId = invite!.params
      await user.save()
    }
  }

  await sendVerificationEmail(
    user /*,
    user.username,
    `${process.env.BASE_URL}/auth/verify_email?k=${user.emailVerificationToken}`*/
  )

  return res.json({
    success: true,
    message: 'check your email for more information',
  })
})

AuthRouter.route('/send_verification_email').post(async (req, res) => {
  let errors = []
  if (!req.body) {
    errors.push('please supply a body')
  }
  if (!req.body.email) {
    errors.push('please supply an email')
  }
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'errors',
      errors,
    })
  }

  let user = await User.findOne({
    where: {
      lowercaseEmail: req.body.email.toLowerCase(),
    },
  })
  if (!user) {
    return res.status(200).json({
      success: true,
      message:
        'if a user with that email exists they will receive a new verification email',
    })
  }

  if (user.emailVerified) {
    return res.status(400).json({
      success: false,
      message: 'your email is already verified',
      errors: ['your email is already verified'],
    })
  }
  await sendVerificationEmail(user)
  return res.status(200).json({
    success: true,
    message:
      'if a user with that email exists they will receive a new verification email',
  })
})

AuthRouter.route('/verify_email').get(async (req, res) => {
  if (!req.query.k) {
    return res.send('no email verification key')
  }
  let user = await User.findOne({
    where: {
      emailVerificationToken: req.query.k,
      emailVerified: false,
    },
  })
  if (!user) {
    return res.send(
      'could not find a user with that email verification key. is your account already verified?'
    )
  }
  user.emailVerified = true
  await user.save()
  await sendMail(
    user.email,
    '[pxl.blue] your email was verified',
    verifyEmailSuccessTemplate(user.username)
  )
  return res.send(
    'your email was verified successfully! redirecting to <a href="https://pxl.blue">pxl.blue</a> in 5 seconds<script>setTimeout(() =>{window.location.href="https:///pxl.blue";}, 5000)</script>'
  )
})

AuthRouter.route('/login').post(async (req, res) => {
  let errors = []
  if (!req.body) {
    errors.push('please supply a body')
  }
  if (!req.body.username) {
    errors.push('please supply a username')
  }
  if (!req.body.password) {
    errors.push('please supply a password')
  }
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'errors',
      errors,
    })
  }
  let user = await User.findOne({
    where: {
      [req.body.username.includes('@')
        ? 'lowercaseEmail'
        : 'lowercaseUsername']: req.body.username.toLowerCase(),
    },
  })
  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'errors',
      errors: ['username or password is invalid'],
    })
  }

  let passwordValid = await argon2.verify(user.password, req.body.password, {
    type: argon2id,
  })
  if (!passwordValid) {
    return res.status(400).json({
      success: false,
      message: 'errors',
      errors: ['username or password is invalid'],
    })
  }

  if (!user.emailVerified) {
    return res.status(400).json({
      success: false,
      message: 'errors',
      errors: ['your email is not verified, please check your email'],
    })
  }

  if (!user.usedIps.includes(req.realIp)) {
    user.usedIps.push(req.realIp)
  }
  let now = moment()

  user.lastLogin = now.toDate()
  await user.save()

  if (user.banned) {
    return res.status(401).json({
      success: false,
      errors: [`your account is banned:\n${user.banReason}`],
    })
  }

  let session = new Session()
  session.sessionString = createSessionToken()
  session.userId = user.id
  session.ip = req.realIp
  session.rememberMe = false
  session.expiresAt = now
    .add(8, req.body.rememberMe ? 'days' : 'hours')
    .toDate()
  await session.save()

  return res.status(200).json({
    success: true,
    message: 'logged in successfully',
    session: session.sessionString,
  })
})

export default AuthRouter
