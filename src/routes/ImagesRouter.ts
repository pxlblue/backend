import express from 'express'

import { authMiddleware, userIsAdmin } from '../util/Middleware'
import { Invite } from '../database/entities/Invite'
import bodyParser from 'body-parser'
import { Image } from '../database/entities/Image'

const ImagesRouter = express.Router()

ImagesRouter.use(bodyParser.json())

ImagesRouter.use(authMiddleware())

ImagesRouter.route('/').get(userIsAdmin(), async (req, res) => {
  let limit = 50
  let page = 0
  let order: 'ASC' | 'DESC' = 'ASC'
  if (req.query && req.query.limit) {
    limit = parseInt(req.query.limit as string)
  }
  if (req.query && req.query.page) {
    page = parseInt(req.query.page as string)
  }
  if (req.query && req.query.order === 'DESC') order = 'DESC'
  page = page * limit

  let images = await Image.find({
    order: {
      id: order,
    },
    take: limit,
    skip: page,
  })
  let count = await Image.count()
  return res.status(200).json({
    success: true,
    message: 'images',
    images: images.map((image) => image.serialize()),
    total: count,
    page: page,
    pages: Math.ceil(count / limit) - 1,
  })
})

ImagesRouter.route('/users/@me').get(async (req, res) => {})

ImagesRouter.route('/users/:id').get(userIsAdmin(), async (req, res) => {
  let limit = 50
  let page = 0
  let order: 'ASC' | 'DESC' = 'ASC'
  if (req.query && req.query.limit) {
    limit = parseInt(req.query.limit as string)
  }
  if (req.query && req.query.page) {
    page = parseInt(req.query.page as string)
  }
  if (req.query && req.query.order === 'DESC') order = 'DESC'
  page = page * limit

  let images = await Image.find({
    order: {
      id: order,
    },
    where: {
      uploader: req.params.id,
    },
    take: limit,
    skip: page,
  })
  let count = await Image.count({
    where: {
      uploader: req.params.id,
    },
  })
  return res.status(200).json({
    success: true,
    message: 'images',
    images: images.map((image) => image.serialize()),
    total: count,
    page: page,
    pages: Math.ceil(count / limit) - 1,
  })
})

export default ImagesRouter
