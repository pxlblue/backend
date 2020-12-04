// Type definitions for ip-to-asn
// Project: https://github.com/chadkeck/ip-to-asn

/// <reference types="node" />

declare module 'ip-to-asn' {
  class IPToASN {
    query: (
      addresses: string[],
      callback: (err: Error | undefined, results: any) => void
    ) => void
  }

  export = IPToASN
}
