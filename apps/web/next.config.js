/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["@recipevault/shared"],
    experimental: {
        forceSwcTransforms: true,
    },
    swcMinify: false,
};

module.exports = nextConfig;
