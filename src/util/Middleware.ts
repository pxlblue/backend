import { Request, Response, NextFunction } from 'express'
import { Session } from '../database/entities/Session'
import moment from 'moment'
import { User } from '../database/entities/User'

export function authMiddleware() {
  return async function middleware(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    req.loggedIn = false
    // find session header
    let sessionToken = null

    if (req.headers.authorization) {
      sessionToken = req.headers.authorization
    }
    if (!sessionToken || !sessionToken.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'authentication required',
        errors: [
          'no session token found in your request, please check your request again',
        ],
      })
    }

    let session = await Session.findOne({
      where: {
        sessionString: sessionToken,
      },
    })

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'authentication required',
        errors: ['session not found'],
      })
    }

    if (session.ip !== req.ip) {
      await session.remove()
      return res.status(401).json({
        success: false,
        message: 'authentication required',
        errors: [
          'your ip has changed since you last logged in, please log in again',
        ],
      })
    }

    let now = moment()

    // check if session expired
    if (session.expiresAt && moment(session.expiresAt).diff(now) < 0) {
      await session.remove()
      return res.status(401).json({
        success: false,
        message: 'authentication required',
        errors: ['your session has expired, please log in again'],
      })
    }

    // all valid!
    let user = await User.findOne({
      where: {
        id: session.userId,
      },
    })
    if (!user) {
      await session.remove()
      return res.status(401).json({
        success: false,
        message: 'authentication required',
        errors: [
          'something bad happened when parsing your session, contact an admin',
        ],
      })
    }

    req.user = user
    req.loggedIn = true

    return next()
  }
}
