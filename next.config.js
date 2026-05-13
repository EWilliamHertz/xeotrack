/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["*.cloudshell.dev", "*.googleusercontent.com", "localhost:3000"],
    },
  },
  // This turns off the strict header check that causes the "Blocked" warning
  devIndicators: {
    appIsrStatus: false,
  }
}

module.exports = nextConfig