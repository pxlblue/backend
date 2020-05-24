import express from 'express'
import { Image } from '../database/entities/Image'
import { bucket } from '../util/StorageUtil'
import rb from 'raw-body'
const ProxyRouter = express.Router()

ProxyRouter.route(['/:file', '/*/:file']).get(async (req, res) => {
  let image = await Image.findOne({
    where: {
      path: req.params.file,
    },
  })
  if (!image) {
    return res.send('image not found')
  }
  let mimeType = image ? image.contentType : 'image/png'
  let [file] = await bucket.file(req.params.file).get()
  let buf = await rb(file.createReadStream())
  return res.contentType(mimeType).send(buf)
})

export default ProxyRouter
