import express from 'express'
import { User } from '../database/entities/User'
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
    .select(['testimonials.testimonial', 'testimonials.author'])
    .where('testimonials.approved = true')
    .from(Testimonial, 'testimonials')
    .orderBy('RANDOM()')
    .limit(1)
    .getOne()
  console.log(testimonial)
  let author = await User.findOne({ where: { id: testimonial?.author } })
  return res.status(200).json({
    success: true,
    testimonial: {
      testimonial: testimonial?.testimonial,
      author: author?.username,
    },
  })
})

export default RootRouter
