import ImageMiddleware from './Middleware'
import { Image, Canvas, CanvasRenderingContext2D } from 'canvas'
import { parseGradient } from '../util'
import { IBorderMiddlewareOptions } from '../options'

export default class BorderMiddleware extends ImageMiddleware {
  options: IBorderMiddlewareOptions
  constructor(options: IBorderMiddlewareOptions) {
    super()
    this.options = options

    if (typeof this.options.expand === 'undefined') this.options.expand = true
  }

  // Why I must manually define the arguments types is beyond me, TypeScript sometimes makes no sense
  async process(image: Image, canvas: Canvas, ctx: CanvasRenderingContext2D) {
    ctx.save()

    ctx.strokeStyle =
      typeof this.options.color === 'string'
        ? this.options.color
        : parseGradient(
            ctx,
            0,
            0,
            image.width,
            image.height,
            this.options.color
          )

    ctx.lineWidth = this.options.width || 1

    /*if (this.options.expand) {
      // extremely broken
      canvas.width = canvas.width + ctx.lineWidth * 2
      canvas.height = canvas.height + ctx.lineWidth * 2
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(
        image,
        ctx.lineWidth,
        ctx.lineWidth,
        image.width,
        image.height
      )
    }*/
    ctx.strokeRect(0, 0, canvas.width, canvas.height)

    ctx.restore()
  }
}
