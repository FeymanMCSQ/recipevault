/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["@recipevault/shared"],
    swcMinify: false,
};

module.exports = nextConfig;
