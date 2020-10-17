import { Request, Response, NextFunction } from 'express'
import { Session } from '../database/entities/Session'
import moment from 'moment'
import { User } from '../database/entities/User'
import { URL } from 'url'

export function authMiddleware(whitelist?: (string | RegExp)[]) {
  return async function middleware(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    // Can't access req.route here, so regexes + string checking must suffice
    if (Array.isArray(whitelist)) {
      let url = new URL(`https://api.pxl.blue${req.url}`).pathname
      for (let item of whitelist) {
        if (item instanceof RegExp) {
          if (url.match(item)) {
            return next()
          }
        } else if (typeof item === 'string') {
          if (url === item) {
            return next()
          }
        }
      }
      // request did not match whitelist, so proceed to check auth
    }
    req.loggedIn = false
    // find session header
    let sessionToken: string | undefined

    if (req.headers.authorization) {
      sessionToken = req.headers.authorization
    }
    if (req.query && req.query.auth) {
      sessionToken = req.query.auth as string
    }
    if (req.body && req.body.auth) {
      sessionToken = req.body.auth
    }
    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: 'authentication required',
        errors: [
          'no session token found in your request, please check your request again',
        ],
      })
    }

    if (sessionToken.startsWith('Bearer ')) {
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
      let user = await User.findOne({
        where: {
          id: session.userId,
        },
        select: ['settings_ipSecurity'],
      })
      if (user?.settings_ipSecurity && session.ip !== req.realIp) {
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
      user = await User.findOne({
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
    } else {
      if (sessionToken == null || sessionToken == undefined) {
        // sanity check because it defaults to null in the Model
        return res.status(401).json({
          success: false,
          message: 'authentication required',
          errors: ['session not found'],
        })
      }
      // assumed its an api key
      let user = await User.findOne({
        where: {
          apiKey: sessionToken,
        },
      })

      // Api key was invalid, so killing the request here
      if (!user || user.apiKey == undefined || user.apiKey == null) {
        return res.status(401).json({
          success: false,
          message: 'authentication required',
          errors: ['session not found'],
        })
      }

      // Check to ensure the user making the req with api key
      // matches one of the users used ips if user has setting enabled
      if (user.settings_apiIpSecurity && !user.usedIps.includes(req.ip)) {
        return res.status(401).json({
          success: false,
          message: 'authentication required',
          errors: [
            'the ip you are connecting with has not been used with the account. please login with username/password before using your API key.',
          ],
        })
      }

      // everything's good, set members on the req and go
      req.user = user
      req.loggedIn = true

      return next()
    }
  }
}

export function userIsModerator() {
  return function middleware(req: Request, res: Response, next: NextFunction) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'auth required',
        errors: ['authorization not provided'],
      })
    }
    if (!req.user.moderator && !req.user.admin) {
      return res.status(401).json({
        success: false,
        message: 'auth required',
        errors: ['this request requires moderator'],
      })
    }
    return next()
  }
}

export function userIsAdmin() {
  return function middleware(req: Request, res: Response, next: NextFunction) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'auth required',
        errors: ['authorization not provided'],
      })
    }
    if (!req.user.admin) {
      return res.status(401).json({
        success: false,
        message: 'auth required',
        errors: ['this request requires admin'],
      })
    }
    return next()
  }
}
