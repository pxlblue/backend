import express from 'express'

const RootRouter = express.Router()

RootRouter.route('/').all((req, res) => {
  res.json({
    status: 200,
    message: 'Welcome to the pxl.blue API',
  })
})

export default RootRouter
