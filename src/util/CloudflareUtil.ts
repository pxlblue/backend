import fetch, { RequestInit } from 'node-fetch'
const API_BASE = 'https://api.cloudflare.com'
class CloudflareApi {
  constructor() {}

  async http(method: string, endpoint: string, body?: object) {
    let opts: RequestInit = {
      headers: {
        'User-Agent': 'pxlblue-frontend/1.0',
      },
      method: method.toUpperCase(),
    }
    if (method !== 'GET' && body) {
      ;(opts as any).headers['Content-Type'] = 'application/json'
      opts.body = JSON.stringify(body)
    }
    ;(opts as any).headers['X-Auth-Email'] = process.env.CF_AUTH_EMAIL!
    ;(opts as any).headers['X-Auth-Key'] = process.env.CF_AUTH_KEY!
    let resp = await fetch(`${API_BASE}${endpoint}`, opts)
    let res = await resp.json()
    return res
  }
  async http_get(endpoint: string) {
    return this.http('get', endpoint)
  }
  async http_post(endpoint: string, body?: object) {
    return this.http('post', endpoint, body)
  }
  async http_patch(endpoint: string, body?: object) {
    return this.http('patch', endpoint, body)
  }

  async createZone(name: string) {
    return this.http_post('/client/v4/zones', {
      name,
      account: {
        id: process.env.CF_ACCOUNT!,
      },
      jump_start: false,
      type: 'full',
    })
  }
  async searchZones(name: string): Promise<any> {
    return this.http_get(`/client/v4/zones?name=${encodeURIComponent(name)}`)
  }
  async getZone(zone: string): Promise<any> {
    return this.http_get(`/client/v4/zones/${encodeURIComponent(zone)}`)
  }
  async setDnsForZone(zone: string) {
    const ip = '34.122.203.96'
    const sslwc = 'sslwc.mirage.photos'
    let res = []
    let z = (await this.getZone(zone)).result
    res.push(
      await this.http_post(`/client/v4/zones/${zone}/dns_records`, {
        type: 'A',
        name: z.name,
        content: ip,
        ttl: 1,
        proxied: true,
      }),
      await this.http_post(`/client/v4/zones/${zone}/dns_records`, {
        type: 'CNAME',
        name: `*.${z.name}`,
        content: sslwc,
        ttl: 1,
      }),
      await this.http_post(`/client/v4/zones/${zone}/dns_records`, {
        type: 'MX',
        name: `${z.name}`,
        content: 'pxl.so',
        ttl: 1,
        priority: 10,
      })
    )
  }
}

const cfApi = new CloudflareApi()
export default cfApi
