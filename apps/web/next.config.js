/**
 * Các package @cute-teachy/* xuất bản mã nguồn TypeScript nên cần transpile.
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@cute-teachy/tokens',
    '@cute-teachy/types',
    '@cute-teachy/i18n',
    '@cute-teachy/core',
    '@cute-teachy/api',
  ],
};

export default nextConfig;
