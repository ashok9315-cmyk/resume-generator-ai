/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export', // Static export for S3 hosting
  trailingSlash: true, // Required for S3 static hosting
  images: {
    unoptimized: true, // Required for static export
  },
  // Temporarily disable TypeScript checking for production build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Environment variables for static export
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://resume-generator-ai.solutionsynth.cloud',
    NEXT_PUBLIC_API_GATEWAY_URL: process.env.API_GATEWAY_URL || 'https://nkxintctea.execute-api.us-east-1.amazonaws.com/prod',
    NEXT_PUBLIC_RESUME_FUNCTION_URL: process.env.RESUME_FUNCTION_URL || 'https://rjstpa3gkzlyayomdodjl5dxju0uxeyg.lambda-url.us-east-1.on.aws/',
    NEXT_PUBLIC_COVER_LETTER_FUNCTION_URL: process.env.COVER_LETTER_FUNCTION_URL || 'https://exfj76qtfsswdyyhrrnuk7g3om0gwuwx.lambda-url.us-east-1.on.aws/',
  },
}

module.exports = nextConfig


