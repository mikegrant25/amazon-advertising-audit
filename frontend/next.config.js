const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  webpack: (config, { isServer }) => {
    // Suppress the specific warning from Supabase realtime-js
    // This warning is due to dynamic require() statements in the library
    // and doesn't affect functionality
    config.module = {
      ...config.module,
      exprContextCritical: false,
    };
    
    return config;
  },
};

module.exports = withBundleAnalyzer(nextConfig);
