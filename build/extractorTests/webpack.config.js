const path = require('path');
const testBuildPath = path.resolve(__dirname, 'userscripts');
const testEntryPath = path.resolve(__dirname, '../../src/extractors/entries');
const webpack = require('webpack');

const PrependMetadata = require('../../webpack_plugins/MetadataPrepender');

// entries
const entries = require('../../src/extractors/entries/index.json').entries;

let scriptEntries = {};
entries.forEach((entry) => {
    scriptEntries[entry.name] = path.resolve(testEntryPath, entry.name + '.ts');
});

// entries metadata
const entriesMetadata = entries.map((entry) => ({
    path: path.resolve(testBuildPath, entry.name + '.js'),
    replace: entry.replace
}));

const metadata = require('./metadata.json');

module.exports = [{
    name: 'testscripts',
    entry: scriptEntries,
    resolve: {
        extensions: ['', '.ts', '.js']
    },

    output: {
        path: testBuildPath,
        filename: '[name].js'
    },

    module: {
        preLoaders: [{
            test: /\.ts$/,
            loader: "tslint"
        }],
        loaders: [{
            test: /\.ts$/,
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
        // run the custom metadata prepender
        new PrependMetadata(metadata, entriesMetadata)
    ]
}];
