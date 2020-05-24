import express from 'express'

const RootRouter = express.Router()

RootRouter.route('/').all((req, res) => {
  res.json({
    status: 200,
    message: 'Welcome to the pxl.blue API',
  })
})

RootRouter.route('/discord').all((req, res) => {
  res.redirect(process.env.DISCORD_INVITE!)
})

export default RootRouter
