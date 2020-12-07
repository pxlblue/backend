import express from 'express'

import { authMiddleware, userIsAdmin } from '../util/Middleware'
import bodyParser from 'body-parser'
import { Image } from '../database/entities/Image'
import { storage } from '../util/StorageUtil'

const ImagesRouter = express.Router()

ImagesRouter.use(bodyParser.json())

ImagesRouter.use(authMiddleware([/^\/[a-z0-9\.]+\/delete$/gi]))

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

ImagesRouter.route('/:image/delete').get(async (req, res) => {
  if (!req.query.k || req.query.k === null) {
    return res.send(
      `<meta http-equiv="refresh" content="5;URL='https://pxl.blue/account/images/'"/><h1>Image does not exist or deletion key was invalid</h1><p>Redirecting to pxl.blue in 5 seconds</p>`
    )
  }
  let image = await Image.findOne({
    where: {
      path: req.params.image,
      deleted: false,
      deletionKey: req.query.k,
    },
  })
  if (!image) {
    return res.send(
      `<meta http-equiv="refresh" content="5;URL='https://pxl.blue/account/images/'"/><h1>Image does not exist or deletion key was invalid</h1><p>Redirecting to pxl.blue in 5 seconds</p>`
    )
  }
  storage.removeObject(process.env.STORAGE_BUCKET!, image.path)
  image.deleted = true
  image.deletionReason = 'USER'
  await image.save()
  return res.send(
    `<meta http-equiv="refresh" content="5;URL='https://pxl.blue/account/images/'"/><h1>Image ${image.path} was deleted</h1><p>hash: <code>${image.hash}</code></p><p>Redirecting to pxl.blue in 5 seconds</p>`
  )
})

export default ImagesRouter
