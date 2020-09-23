import { createCanvas, loadImage, registerFont } from 'canvas'
import TextMiddleware from './middleware/Text'
import path from 'path'
import { IImageMiddlewareSettings } from './util'
import ImageMiddleware from './middleware/Middleware'
import { IBorderMiddlewareOptions, ITextMiddlewareOptions } from './options'
import BorderMiddleware from './middleware/Border'

const fonts = [
  {
    path: 'BonbonLight.otf',
    family: 'Bonbon',
    weight: 'light',
  },
  {
    path: 'BonbonRegular.otf',
    family: 'Bonbon',
    weight: 'normal',
  },
  {
    path: 'BonbonBold.otf',
    family: 'Bonbon',
    weight: 'bold',
  },
]

export function registerFonts() {
  const fontsDir = path.resolve(__dirname, 'fonts')
  fonts.forEach((font) => {
    console.log('registering font', font.path)
    registerFont(path.join(fontsDir, font.path), {
      family: font.family,
      weight: font.weight,
    })
  })
}

export async function processImage(
  uploadedImage: Buffer,
  middlewares: IImageMiddlewareSettings
): Promise<Buffer> {
  if (uploadedImage.byteLength > 2000000) return uploadedImage // dont process imgs > 2MB

  const image = await loadImage(uploadedImage)
  const canvas = createCanvas(image.width, image.height),
    ctx = canvas.getContext('2d')

  ctx.drawImage(image, 0, 0, image.width, image.height)

  for (let middlewareObj of middlewares.middleware) {
    let mw: ImageMiddleware
    console.log(middlewareObj.type)
    switch (middlewareObj.type) {
      case 'text':
      default:
        mw = new TextMiddleware(middlewareObj.options as ITextMiddlewareOptions)
        break
      case 'border':
        mw = new BorderMiddleware(
          middlewareObj.options as IBorderMiddlewareOptions
        )
        break
    }
    await mw.process(image, canvas, ctx)
  }

  let buf = canvas.toBuffer()
  return buf
}
