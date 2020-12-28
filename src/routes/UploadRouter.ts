import express from 'express'
import bodyParser from 'body-parser'
import multer from 'multer'
import { User } from '../database/entities/User'
import path from 'path'
import { Image } from '../database/entities/Image'
import {
  randomBytes,
  randomImageId,
  randomInvisibleId,
} from '../util/RandomUtil'
import crypto from 'crypto'
import { storage } from '../util/StorageUtil'
import { processImage } from '../images'
import _ from 'lodash'
import { ShortURL } from '../database/entities/ShortURL'
import moment from 'moment'

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

function getRandomHost(user: User): string {
  return _.sample(user.settings_randomDomains) || 'i.pxl.blue'
}

const MOMENT_TKN_REGEX = /{moment:([^}]+)}/i
function parseEmbedString(fmt: string, user: User, image: Image): string {
  let date = moment(image.uploadTime)
  fmt = fmt
    .replace(/{username}/gi, user.username)
    .replace(/{date}/gi, date.format('MM/DD/YYYY'))
    .replace(/{longdate}/gi, date.format('MMMM Do YYYY'))
    .replace(/{time}/gi, date.format('LT'))
    .replace(/{timestamp}/gi, date.format('MM/DD/YYYY LT'))
    .replace(/{path}/gi, image.path)
  let match = fmt.match(MOMENT_TKN_REGEX)
  while (match) {
    console.log(match[0], '->', match[1], '=', date.format(match[1]))
    fmt = fmt.replace(match[0], date.format(match[1]))
    match = fmt.match(MOMENT_TKN_REGEX)
  }
  return fmt
}

async function uploadImage(
  host: string,
  user: User,
  file: Express.Multer.File,
  useOriginalName: boolean,
  ip: string,
  filename?: string
): Promise<Image> {
  return new Promise(async (resolve, reject) => {
    user.imageCount = user.imageCount + 1
    if (!user.usedIps.includes(ip)) {
      user.usedIps = [...user.usedIps, ip]
    }
    user.save() // Not awaited, slightly faster

    if (host === 'pxl_rand') {
      host = getRandomHost(user)
    }

    // process middleware
    let img = file.buffer
    if (user.settings_imageMiddleware) {
      img = await processImage(img, user.imageMiddleware)
    }

    let image = new Image()
    image.shortId = randomImageId(user.settings_secureURLs)
    let ext = path.extname(file.originalname)

    if (useOriginalName) {
      try {
        await storage.statObject(
          process.env.STORAGE_BUCKET!,
          `${filename}${ext}`
        )
      } catch (err) {
        image.shortId = filename!
      }
    }
    if (
      user.embed &&
      file.mimetype &&
      file.mimetype.startsWith('image/') // only embed Images
    ) {
      image.shortId = 'em' + image.shortId
      image.embed = user.embed
    }
    image.host = host
    image.path = `${image.shortId}${ext}`
    image.size = file.size
    image.uploadTime = new Date()
    image.url = `https://${host}/${image.path}`
    if (host.startsWith('http://')) {
      image.url = `${host}/${image.path}`
    }

    image.hash = 'temp'

    image.uploader = user.id
    image.contentType = file.mimetype
    image.originalName = file.originalname
    image.uploaderIp = ip
    image.deletionKey = randomBytes(24)
    if (image.embed) {
      image.embedAuthor = user.embedAuthor
      image.embedAuthorStr = parseEmbedString(
        user.embedAuthorStr || user.username,
        user,
        image
      )
      image.embedTitle = parseEmbedString(user.embedTitle, user, image)
      image.embedDescription = parseEmbedString(
        user.embedDescription,
        user,
        image
      )
      image.embedColor = user.embedColor
    }
    image.save().then(() => {
      const sha256 = crypto.createHash('sha256')
      image.hash = sha256.update(img).digest('hex')
      image.save()
    })
    storage.putObject(
      process.env.STORAGE_BUCKET!,
      image.path,
      img,
      img.byteLength,
      {
        'Content-Type': file.mimetype,
        'X-Pxl-Uploader': user.id,
        'X-Pxl-Uploader-Username': user.username,
        'X-Pxl-Uploader-IP': ip,
      },
      () => {
        resolve(image)
      }
    )
  })
}

UploadRouter.route('/extra').post(upload.single('file'), async (req, res) => {
  let key = req.body.key
  let user = await User.findOne({
    where: {
      uploadKey: key,
    },
  })
  if (!user) {
    return res.status(401).send({
      success: false,
      errors: ['Upload key is invalid'],
    })
  }
  if (user.banned) {
    return res.status(401).send({
      success: false,
      errors: [
        'You are banned from pxl.blue\nCheck your email for more information.',
      ],
    })
  }
  let originalName = false
  let filename = req.file.originalname
  if (user.moderator && req.body.originalName) {
    if (req.body.filename) {
      filename = req.body.filename
    }
    originalName = true
  }
  let host = req.body.host || 'i.pxl.blue'
  let image = await uploadImage(
    host,
    user,
    req.file,
    originalName,
    req.realIp,
    filename
  )
  res.status(200).json({
    success: true,
    image,
    url: (user.settings_discordLink ? '\u200b' : '') + image.url, // preferable to use this due to user settings affecting it
    rawUrl: image.url,
    deletionUrl: `${process.env.BASE_URL}/images/${image.path}/delete?k=${image.deletionKey}`,
  })
})

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
        'You are banned from pxl.blue\nCheck your email for more information.'
      )
  }
  let host = req.body.host || 'i.pxl.blue'
  let image = await uploadImage(host, user, req.file, false, req.realIp)
  res.status(200).send((user.settings_discordLink ? '\u200b' : '') + image.url)
})

UploadRouter.route('/shorten').post(async (req, res) => {
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
        'You are banned from pxl.blue\nCheck your email for more information.'
      )
  }

  if (!req.body.destination) {
    return res
      .status(200)
      .send(
        'No destination URL was sent in your request\nPlease check your request and try again.'
      )
  }

  let shortUrl = new ShortURL()
  shortUrl.creator = user.id
  shortUrl.host = req.body.host || 'i.pxl.blue'
  if (shortUrl.host === 'pxl_rand') {
    shortUrl.host = getRandomHost(user)
  }
  shortUrl.creationTime = new Date()
  shortUrl.creatorIp = req.ip

  shortUrl.shortId = user.settings_invisibleShortURLs
    ? randomInvisibleId(user.settings_secureURLs)
    : randomImageId(user.settings_secureURLs)

  shortUrl.url = `https://${shortUrl.host}/${shortUrl.shortId}`
  shortUrl.destination = req.body.destination
  if (!shortUrl.destination.startsWith('http')) {
    // Needed for discordLink support sharex URL => shortener workflow
    let idx = shortUrl.destination.indexOf('http')
    if (idx === -1)
      return res
        .status(200)
        .send(
          'Destination URL is invalid.\nPlease check your request and try again.'
        )
    shortUrl.destination = shortUrl.destination.substr(idx)
  }
  await shortUrl.save()
  return res.status(200).json({
    success: true,
    shortened: shortUrl.serialize(),
    url: (user.settings_discordLink ? '\u200b' : '') + shortUrl.url,
  })
})

export default UploadRouter
