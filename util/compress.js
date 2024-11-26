const sharp = require("sharp");

function compress(input, webp, grayscale, quality, originSize, maxWidth) {
    const format = "jpeg";

    // Kompres dan resize gabar, atur lebar maksimum menjadi 200px
    return sharp(input)
        .resize({ width: maxWidth })  // Resize gambar dengan lebar maksimum 200px, menjaga aspek rasio
        .grayscale(grayscale)
        .toFormat(format, {
            quality: quality,  // Kualitas kompresi yang diterima dari `index.js`
            progressive: true,
            optimizeScans: true
        })
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
            return {
                err: err
            };
        });
}

module.exports = compress;