/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Necesario para Docker production build
  output: 'standalone',
}

module.exports = nextConfig
