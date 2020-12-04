import express from 'express'

import { authMiddleware } from '../util/Middleware'
import { randomBytes } from '../util/RandomUtil'
import { User } from '../database/entities/User'
import bodyParser from 'body-parser'
import querystring from 'querystring'
import fetch from 'node-fetch'
const DiscordRouter = express.Router()

DiscordRouter.use(bodyParser.json())

DiscordRouter.route('/').all((req, res) => {
  res.redirect(process.env.DISCORD_INVITE!)
})

DiscordRouter.route('/login').post(authMiddleware(), async (req, res) => {
  // create state
  req.user.discordState = randomBytes()
  await req.user.save()

  // create url
  return res.json({
    success: true,
    url: `https://discordapp.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${process.env.BASE_URL}/discord/redirect&response_type=code&scope=identify%20guilds%20guilds.join&state=${req.user.discordState}`,
  })
})

DiscordRouter.route('/redirect').get(async (req, res) => {
  let code = req.query.code
  let state = req.query.state
  if (!code || !state)
    return res.send(
      `<meta http-equiv="refresh" content="5;URL='https://pxl.blue/account/discord/'"/><h1>Your Discord link failed - no code or state</h1><p>Redirecting to pxl.blue in 5 seconds</p>`
    )

  let user = await User.findOne({
    where: {
      discordState: state,
    },
  })
  if (!user)
    return res.send(
      `<meta http-equiv="refresh" content="5;URL='https://pxl.blue/account/discord/'"/><h1>Your Discord link failed - state invalid</h1><p>Redirecting to pxl.blue in 5 seconds</p>`
    )
  const tokenRes = await fetch('https://discordapp.com/api/oauth2/token', {
    method: 'POST',
    body: querystring.stringify({
      client_id: process.env.DISCORD_CLIENT_ID!,
      client_secret: process.env.DISCORD_CLIENT_SECRET!,
      grant_type: 'authorization_code',
      code: code as string,
      redirect_uri: `${process.env.BASE_URL}/discord/redirect`,
      scope: 'identify guilds guilds.join',
    }),
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
  })
  const tokenJson = await tokenRes.json()
  console.log(tokenJson)
  const userRes = await fetch('https://discord.com/api/users/@me', {
    headers: {
      authorization: `${tokenJson.token_type} ${tokenJson.access_token}`,
    },
  })
  const userJson = await userRes.json()
  const roles = [process.env.DISCORD_ROLE_MEMBER]

  if (user.limited && userJson.id !== user.limitedId) {
    return res.send(
      `<meta http-equiv="refresh" content="5;URL='https://pxl.blue/account/discord/'"/><h1>Your Discord link failed</h1><p>${userJson.username}#${userJson.discriminator} (<code>${userJson.id}</code>) is not the account you boosted the server with. Please link the account you boosted the server with.<p>Redirecting to pxl.blue in 5 seconds</p>`
    )
  }

  await fetch(
    `https://discord.com/api/guilds/${process.env.DISCORD_GUILD!}/members/${
      userJson.id
    }`,
    {
      method: 'PUT',
      body: JSON.stringify({
        access_token: tokenJson.access_token,
        nick: user.username,
        roles,
      }),
      headers: {
        'content-type': 'application/json',
        authorization: `Bot ${process.env.DISCORD_TOKEN!}`,
      },
    }
  )

  if (!!user.discordId) {
    await fetch(
      `https://discord.com/api/guilds/${process.env.DISCORD_GUILD!}/members/${
        userJson.id
      }/roles/${process.env.DISCORD_ROLE_MEMBER!}`,
      {
        method: 'DELETE',
        headers: {
          authorization: `Bot ${process.env.DISCORD_TOKEN!}`,
        },
      }
    )
  }

  await fetch(
    `https://discord.com/api/guilds/${process.env.DISCORD_GUILD!}/members/${
      userJson.id
    }`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        nick: user.username,
      }),
      headers: {
        'content-type': 'application/json',
        authorization: `Bot ${process.env.DISCORD_TOKEN!}`,
      },
    }
  )
  await fetch(
    `https://discord.com/api/guilds/${process.env.DISCORD_GUILD!}/members/${
      userJson.id
    }/roles/${process.env.DISCORD_ROLE_MEMBER!}`,
    {
      method: 'PUT',
      headers: {
        authorization: `Bot ${process.env.DISCORD_TOKEN!}`,
      },
    }
  )
  console.log(userJson)
  user.discordId = userJson.id
  user.discordTag = `${userJson.username}#${userJson.discriminator}`
  await user.save()
  return res.send(
    `<meta http-equiv="refresh" content="5;URL='https://pxl.blue/account/discord/'"/><h1>Your Discord link succeeded</h1><p>Your discord is ${userJson.username}#${userJson.discriminator}<p>Redirecting to pxl.blue in 5 seconds</p>`
  )
})

export default DiscordRouter
