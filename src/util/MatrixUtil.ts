import fetch from 'node-fetch'
import crypto from 'crypto'

export async function createMatrixUser(username: string, password: string) {
  const nonceRes = await fetch(
    `${process.env.SYNAPSE_URL}/_matrix/client/r0/admin/register`
  )
  const nonce = (await nonceRes.json()).nonce

  const hash = crypto.createHmac('sha1', process.env.SYNAPSE_REGISTRATION_PSK!)
  hash
    .update(nonce)
    .update(String.fromCharCode(0)) // \00 does not work here
    .update(username)
    .update(String.fromCharCode(0))
    .update(password)
    .update(String.fromCharCode(0))
    .update('notadmin')
  let mac = hash.digest('hex')

  let res = await fetch(
    `${process.env.SYNAPSE_URL}/_matrix/client/r0/admin/register`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nonce,
        mac,
        username,
        password,
        admin: false,
      }),
    }
  )
  return res.json()
}
