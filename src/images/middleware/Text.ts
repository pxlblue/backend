import ImageMiddleware from './Middleware'
import { Image, Canvas, CanvasRenderingContext2D } from 'canvas'
import { escapeString, IAnchor, parseGradient } from '../util'
import { ITextMiddlewareOptions } from '../options'

export default class TextMiddleware extends ImageMiddleware {
  options: ITextMiddlewareOptions
  constructor(options: ITextMiddlewareOptions) {
    super()
    this.options = options

    // sanitize
    //this.options.fontSize = this.options.fontSize.split(' ')[0]
    this.options.font = escapeString(this.options.font)

    if (typeof this.options.fixBoundingBox === 'undefined')
      this.options.fixBoundingBox = true

    console.log(this.options.anchor)
  }

  // Why I must manually define the arguments types is beyond me, TypeScript sometimes makes no sense
  async process(image: Image, canvas: Canvas, ctx: CanvasRenderingContext2D) {
    ctx.save()

    ctx.font = `${this.options.fontWeight || 'normal'} ${
      this.options.fontSize
    }px '${this.options.font}'`
    let textSize = ctx.measureText(this.options.text)

    let { x, y } = this.options

    switch (this.options.anchor) {
      case IAnchor.TOPLEFT:
      default:
        if (this.options.fixBoundingBox) y += textSize.actualBoundingBoxAscent
        break
      case IAnchor.TOPMIDDLE:
        x = image.width / 2 - textSize.width / 2
        if (this.options.fixBoundingBox) y += textSize.actualBoundingBoxAscent
        break
      case IAnchor.TOPRIGHT:
        x = image.width - x
        if (this.options.fixBoundingBox) y += textSize.actualBoundingBoxAscent
        if (this.options.fixBoundingBox) x -= textSize.width
        break
      case IAnchor.MIDDLELEFT:
        y = image.height / 2 + this.options.fontSize / 2
        break
      case IAnchor.CENTER:
        x = image.width / 2 - textSize.width / 2
        y = image.height / 2 + this.options.fontSize / 2
        break
      case IAnchor.MIDDLERIGHT:
        x = image.width - x
        y = image.height / 2 + this.options.fontSize / 2
        if (this.options.fixBoundingBox) x -= textSize.width
        break
      case IAnchor.BOTTOMLEFT:
        y = image.height - y
        break
      case IAnchor.BOTTOMMIDDLE:
        x = image.width / 2 - textSize.width / 2
        y = image.height - y
        break
      case IAnchor.BOTTOMRIGHT:
        x = image.width - x
        y = image.height - y
        if (this.options.fixBoundingBox) x -= textSize.width
        break
    }

    ctx.fillStyle =
      typeof this.options.color === 'string'
        ? this.options.color
        : parseGradient(
            ctx,
            x,
            y,
            x + textSize.width,
            y + textSize.actualBoundingBoxAscent,
            this.options.color
          )

    if (this.options.stroke) {
      ctx.strokeStyle =
        typeof this.options.strokeStyle === 'string'
          ? this.options.strokeStyle
          : parseGradient(
              ctx,
              x,
              y,
              x + textSize.width,
              y + textSize.actualBoundingBoxAscent,
              this.options.strokeStyle!
            )
      ctx.lineWidth = this.options.strokeWidth || 1
      ctx.strokeText(this.options.text, x, y)
    }

    ctx.fillText(this.options.text, x, y)

    ctx.restore()
  }
}
