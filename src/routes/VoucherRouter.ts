import express from 'express'

import { authMiddleware, userIsAdmin } from '../util/Middleware'
import { Invite } from '../database/entities/Invite'
import bodyParser from 'body-parser'
import { Image } from '../database/entities/Image'
import util from 'util'
import { Voucher } from '../database/entities/Voucher'
import { randomBytes } from '../util/RandomUtil'
import ms from 'ms'
import moment from 'moment'
const VoucherRouter = express.Router()

VoucherRouter.use(bodyParser.json())

VoucherRouter.use(authMiddleware())

VoucherRouter.route('/redeem').post(async (req, res) => {
  if (!req.body || !req.body.voucher)
    return res
      .status(400)
      .json({ success: false, errors: ['voucher does not exist'] })
  let voucher = await Voucher.findOne({
    where: {
      voucher: req.body.voucher,
      redeemed: false,
    },
  })
  if (!voucher)
    return res.status(400).json({
      success: false,
      errors: ['voucher does not exist or was already redeemed'],
    })

  if (req.user.mailAccess && req.user.mailAccessExpires !== null) {
    let t = moment(req.user.mailAccessExpires)
    t = t.add.apply(t, voucher.duration.split(' ') as any)
    req.user.mailAccessExpires = t.toDate()
  } else {
    let t = moment()
    t = t.add.apply(t, voucher.duration.split(' ') as any)
    req.user.mailAccessExpires = t.toDate()
  }
  req.user.mailAccess = true

  await req.user.save()

  voucher.redeemed = true
  voucher.redeemedBy = req.user.id
  await voucher.save()

  return res.status(200).json({
    success: true,
    message: `voucher redeemed for type "${voucher.type}"`,
  })
})

VoucherRouter.route('/create/mail1m').post(userIsAdmin(), async (req, res) => {
  let voucher = new Voucher()
  voucher.type = 'mail'
  voucher.voucher = `${voucher.type}_1m_${randomBytes(24)}`
  voucher.duration = '30 days'
  await voucher.save()

  res.json({ success: true, message: voucher.voucher })
})

export default VoucherRouter
