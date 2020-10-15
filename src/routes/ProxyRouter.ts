import express from 'express'
import { Image } from '../database/entities/Image'
import { bucket } from '../util/StorageUtil'
import fetch from 'node-fetch'
import moment from 'moment'
import path from 'path'
import rb from 'raw-body'
import { ShortURL } from '../database/entities/ShortURL'
import escapeHtml from 'escape-html'

const ProxyRouter = express.Router()

ProxyRouter.route('/').get((req, res) => {
  res.redirect('https://pxl.blue?utm_source=proxy')
})

ProxyRouter.route(['/:file', '/*/:file']).get(async (req, res) => {
  console.log(path.basename(req.params.file))
  if (!path.basename(req.params.file).includes('.')) {
    // treat as a ShortURL
    let url = await ShortURL.findOne({
      where: {
        shortId: req.params.file.endsWith('+')
          ? req.params.file.slice(0, -1)
          : req.params.file,
      },
    })
    if (!url) {
      return res.send('url not found')
    }
    let reveal = req.params.file.endsWith('+')
    if (reveal) {
      return res.send(
        `<p>This link will send you to <code>${escapeHtml(
          url.destination
        )}</code>. Are you sure you want to continue?</p><a href="${escapeHtml(
          url.destination
        )}">Proceed to ${escapeHtml(url.destination)}</a>`
      )
    }

    return res.redirect(url.destination)
  }
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
