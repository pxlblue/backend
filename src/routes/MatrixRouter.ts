import express from 'express'

import { authMiddleware } from '../util/Middleware'
import bodyParser from 'body-parser'
import { createMatrixUser } from '../util/MatrixUtil'

const MatrixRouter = express.Router()

MatrixRouter.use(bodyParser.json())
MatrixRouter.use(authMiddleware())

MatrixRouter.route('/register').post(async (req, res) => {
  if (!req.body.password) {
    return res
      .status(400)
      .json({ success: false, errors: ['No password in body'] })
  }
  if (req.user.matrixAccountCreated)
    return res
      .status(400)
      .json({ success: false, errors: ['Matrix account was already created'] })
  let matrixUser = await createMatrixUser(
    req.user.lowercaseUsername,
    req.body.password
  )
  if (matrixUser.errcode) {
    return res.status(400).json({
      success: false,
      errors: [`${matrixUser.errcode}: ${matrixUser.error}`],
    })
  }
  req.user.matrixAccountCreated = true
  await req.user.save()
  return res.status(200).json({
    success: true,
    message: `Matrix user created, username ${matrixUser.user_id}`,
  })
})

export default MatrixRouter
