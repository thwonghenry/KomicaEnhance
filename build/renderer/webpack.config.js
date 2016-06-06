const path = require('path');
const testBuildPath = path.resolve(__dirname, 'userscripts');
const testEntryPath = path.resolve(__dirname, '../../src/renderer');
const webpack = require('webpack');

const PrependMetadata = require('../../webpack_plugins/MetadataPrepender');

// entries
// const entries = require('../../src/extractors/entries/index.json').entries;
//
// let scriptEntries = {};
// entries.forEach((entry) => {
//     scriptEntries[entry.name] = path.resolve(testEntryPath, entry.name + '.ts');
// });
//
// // entries metadata
// const entriesMetadata = entries.map((entry) => ({
//     path: path.resolve(testBuildPath, entry.name + '.js'),
//     replace: entry.replace
// }));
//
// const metadata = require('./metadata.json');

module.exports = [{
    name: 'KomicaEnhance',
    entry: path.resolve(testEntryPath, 'main.tsx'),
    resolve: {
        extensions: ['', '.tsx', '.ts', '.js']
    },

    output: {
        path: testBuildPath,
        filename: 'main.js'
    },

    module: {
        preLoaders: [{
            test: /\.tsx?$/,
            loader: "tslint"
        }],
        loaders: [{
            test: /\.tsx?$/,
            loader: 'awesome-typescript-loader'
        }, {
            test: /\.jade$/,
            loader: 'jade'
        }, {
            test: /\.sass$/,
            loader: 'css/locals!sass'
        }]
    },

    plugins: [
        new webpack.DefinePlugin({
            "process.env": {
                NODE_ENV: JSON.stringify("production")
            }
        }),
    ]
}];
