const sharp = require("sharp");

function compress(input, quality, originSize) {
    const format = "jpeg";  // Ganti ke jpeg, bukan webp

    return sharp(input)
        .jpeg({ quality, progressive: true, optimizeScans: true })  // Hanya JPEG
        .toBuffer({ resolveWithObject: true })
        .then(({ data: output, info }) => {
            return {
                err: null,
                headers: {
                    "content-type": `image/${format}`,
                    "content-length": info.size,
                    "x-original-size": originSize,
                    "x-bytes-saved": originSize - info.size,
                },
                output: output
            };
        }).catch(err => {
            return { err: err };
        });
}

module.exports = compress;
