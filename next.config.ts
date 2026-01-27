import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
}

export default nextConfig