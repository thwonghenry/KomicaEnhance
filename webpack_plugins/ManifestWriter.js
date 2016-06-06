const fs = require('fs');

function metadataToManifest(metadata) {
    let content_scripts = {
        all_frames: true,
        js: [metadata.content_scripts],
        matches: metadata.matches,
        run_at: metadata.run_at
    }
    return {
        content_scripts: [content_scripts],
        description: metadata.description,
        name: metadata.name,
        manifest_version: 2,
        version: metadata.version
    }
}

function ManifestWriter(metadata, path) {
    const apply = (compiler) => {
        compiler.plugin('after-emit', (compilation, callback) => {
            fs.writeFile(path, JSON.stringify(metadataToManifest(metadata), null, '\t', 'utf8', callback));
        });
    }
    return {
        apply: apply
    };
}

// export the constructor
module.exports = ManifestWriter;
