/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["@recipevault/shared"],
    experimental: {
        forceSwcTransforms: true,
    },
};

module.exports = nextConfig;
