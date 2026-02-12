const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

// Find the project and workspace root directories
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Exclude other node_modules to prevent version conflicts (important for pnpm)
config.resolver.blockList = [
    /.*\/apps\/web\/node_modules\/.*/,
    /.*\/apps\/extension\/node_modules\/.*/,
];

// 4. Force Metro to resolve (sub)dependencies only from the local node_modules when possible
config.resolver.extraNodeModules = {
    'react': path.resolve(projectRoot, 'node_modules/react'),
    'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
    'react-native-css-interop': path.resolve(projectRoot, 'node_modules/react-native-css-interop'),
    'react-native-reanimated': path.resolve(projectRoot, 'node_modules/react-native-reanimated'),
    'react-native-worklets-core': path.resolve(projectRoot, 'node_modules/react-native-worklets-core'),
    '@recipevault/shared': path.resolve(workspaceRoot, 'packages/shared/src'),
};

// 5. Allow hierarchical lookup (Important for pnpm symlinks)
config.resolver.disableHierarchicalLookup = false;

// 6. Trace resolutions to find leaks
config.resolver.resolveRequest = (context, moduleName, platform) => {
    const resolution = context.resolveRequest(context, moduleName, platform);
    if (moduleName === 'react' || moduleName === 'react-dom') {
        console.log(`[METRO RESOLVE] ${moduleName} -> ${resolution.filePath}`);
    }
    return resolution;
};

module.exports = withNativeWind(config, { input: './global.css' });
