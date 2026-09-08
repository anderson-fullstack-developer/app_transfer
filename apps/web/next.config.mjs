/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Pacotes do monorepo consumidos como TypeScript/ESM.
  transpilePackages: ['@app/ui', '@app/shared'],
  typedRoutes: true,
};

export default nextConfig;
