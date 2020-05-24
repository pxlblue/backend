import express from 'express'
import { randomBytes, createSessionToken } from '../util/RandomUtil'
import { Session } from '../database/entities/Session'
import { User } from '../database/entities/User'
import argon2, { argon2id } from 'argon2'
import bodyParser from 'body-parser'
import moment from 'moment'

const valid_username_regex = /^[a-z0-9]+$/i
const email_regex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/

const AuthRouter = express.Router()

AuthRouter.use(bodyParser.json())

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
  if (req.body.password.length < 6) {
    errors.push('password must be longer than 6 characters')
  }
  if (!req.body.username.match(valid_username_regex)) {
    errors.push('username must be alphanumeric')
  }
  if (!req.body.email.match(email_regex)) {
    errors.push('email is not valid')
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
      lowercaseUsername: req.body.username,
    },
  })
  let emails = await User.find({
    where: {
      lowercaseEmail: req.body.email,
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
  let user = new User()
  user.username = req.body.username
  user.email = req.body.email
  user.lowercaseUsername = user.username.toLowerCase()
  user.lowercaseEmail = user.email.toLowerCase()
  user.registrationDate = new Date()
  user.registrationIp = req.ip
  user.usedIps = [user.registrationIp]
  user.uploadKey = randomBytes()
  user.emailVerificationToken = randomBytes()

  let hashedPassword = await argon2.hash(req.body.password, {
    type: argon2id,
  })
  user.password = hashedPassword
  await user.save()

  return res.json({
    success: true,
    message: 'check your email for more information',
  })
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
        : 'lowercaseUsername']: req.body.username,
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
  let now = moment()

  user.lastLogin = now.toDate()
  await user.save()

  let session = new Session()
  session.sessionString = createSessionToken()
  session.userId = user.id
  session.ip = req.ip
  session.rememberMe = false
  session.expiresAt = now.add(8, 'hours').toDate()
  await session.save()

  return res.status(200).json({
    success: true,
    message: 'logged in successfully',
    session: session.sessionString,
  })
})

export default AuthRouter
