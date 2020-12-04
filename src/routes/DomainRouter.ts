import express from 'express'

import bodyParser from 'body-parser'
import { Domain } from '../database/entities/Domain'

const valid_username_regex = /^[a-z0-9]+$/i
const email_regex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/

const DomainRouter = express.Router()

DomainRouter.use(bodyParser.json())

DomainRouter.route('/').get(async (req, res) => {
  let domains = await Domain.find({
    where: {
      public: true,
      disabled: false,
    },
    order: {
      id: 'ASC',
    },
  })
  let count = await Domain.count({
    where: {
      public: true,
      disabled: false,
    },
  })
  return res.status(200).json({
    success: true,
    message: 'domains',
    count,
    domains: domains.map((domain) => domain.serialize()),
  })
})

export default DomainRouter
