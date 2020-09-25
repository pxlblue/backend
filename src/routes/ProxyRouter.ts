import express from 'express'
import { Image } from '../database/entities/Image'
import { bucket } from '../util/StorageUtil'
import fetch from 'node-fetch'
import moment from 'moment'
import path from 'path'
import rb from 'raw-body'
const ProxyRouter = express.Router()

ProxyRouter.route('/').get((req, res) => {
  res.redirect('https://pxl.blue?utm_source=proxy')
})

ProxyRouter.route(['/:file', '/*/:file']).get(async (req, res) => {
  let image = await Image.findOne({
    where: {
      path: req.params.file,
      deleted: false,
    },
  })
  if (!image) {
    return res.send('image not found')
  }
  let mimeType = image ? image.contentType : 'image/png'
  if (req.headers.range || image.contentType.startsWith('video/')) {
    // this is extremely hacky but it works.
    let [url] = await bucket.file(req.params.file).getSignedUrl({
      action: 'read',
      expires: moment().add(5, 'minutes').toDate(),
    })
    let fres = await fetch(url, {
      headers: {
        range: req.headers.range!,
      },
    })
    let data = await fres.buffer()
    console.log(data)
    return res
      .status(fres.status)
      .contentType(mimeType)
      .set('Content-Range', fres.headers.get('Content-Range')!)
      .set('Content-Length', fres.headers.get('Content-Length')!)
      .send(data)
  }
  let [file] = await bucket.file(req.params.file).get()
  let buf = await rb(file.createReadStream())
  return res.contentType(mimeType).send(buf)
})

export default ProxyRouter
