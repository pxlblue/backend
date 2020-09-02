import express from 'express'
import bodyParser from 'body-parser'
import multer from 'multer'
import { User } from '../database/entities/User'
import path from 'path'
import { Image } from '../database/entities/Image'
import { randomImageId } from '../util/RandomUtil'
import crypto from 'crypto'
import { bucket } from '../util/StorageUtil'
const UploadRouter = express.Router()

UploadRouter.use(bodyParser.json())
UploadRouter.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

const upload = multer({
  storage: multer.memoryStorage(),
})

async function uploadImage(
  host: string,
  user: User,
  file: Express.Multer.File,
  useOriginalName: boolean,
  ip: string
): Promise<Image> {
  user.imageCount = user.imageCount + 1
  await user.save()
  let image = new Image()
  image.shortId = randomImageId()
  image.host = host
  let ext = path.extname(file.originalname)
  image.path = `${image.shortId}${ext}`
  image.size = file.size
  image.uploadTime = new Date()
  image.url = `https://${host}/${image.path}`
  const sha256 = crypto.createHash('sha256')
  image.hash = sha256.update(file.buffer).digest('hex')
  image.uploader = user.id
  image.contentType = file.mimetype
  image.originalName = file.originalname
  image.uploaderIp = ip
  await image.save()
  await bucket.file(image.path).save(file.buffer)

  return image
}

UploadRouter.route('/sharex').post(upload.single('file'), async (req, res) => {
  let key = req.body.key
  let user = await User.findOne({
    where: {
      uploadKey: key,
    },
  })
  if (!user) {
    return res
      .status(200)
      .send('Upload key is invalid\nPlease regenerate your config at pxl.blue')
  }
  if (user.banned) {
    return res
      .status(200)
      .send(
        'You are banned from pxl.blue\nCheck your email for more information'
      )
  }
  let host = req.body.host || 'i.pxl.blue'
  let image = await uploadImage(host, user, req.file, false, req.realIp)
  res.status(200).send(image.url)
})

export default UploadRouter
