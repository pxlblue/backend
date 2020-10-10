import express from 'express'
import { Testimonial } from '../database/entities/Testimonial'

const RootRouter = express.Router()

RootRouter.route('/').all((req, res) => {
  res.json({
    status: 200,
    message: 'Welcome to the pxl.blue API!',
  })
})

RootRouter.route('/testimonial').get(async (req, res) => {
  let testimonial = await Testimonial.getRepository()
    .createQueryBuilder()
    .select('testimonials.testimonial')
    .from(Testimonial, 'testimonials')
    .orderBy('RANDOM()')
    .limit(1)
    .getOne()

  return res
    .status(200)
    .json({ success: true, testimonial: testimonial?.serialize() })
})

export default RootRouter
