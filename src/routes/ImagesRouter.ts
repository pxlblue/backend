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
  if (req.query && req.query.limit) {
    limit = parseInt(req.query.limit as string)
  }
  if (req.query && req.query.page) {
    page = parseInt(req.query.page as string)
  }
  page = page * limit

  let images = await Image.find({
    order: {
      id: 'ASC',
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

export default ImagesRouter
