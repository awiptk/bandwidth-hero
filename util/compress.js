const sharp = require("sharp");

function compress(input, webp, grayscale, quality, originSize, maxWidth = 500) {
    const format = webp ? "webp" : "jpeg";

    // Kompres dan resize gambar, atur lebar maksimum menjadi 500px
    return sharp(input)
        .resize({ width: maxWidth, kernel: sharp.kernel.lanczos3 })  // Resize gambar dengan lebar maksimum 500px, menjaga aspek rasio
        .grayscale(grayscale)
        .toFormat(format, {
            quality: quality || 90,  // Kualitas kompresi default ke 90 jika tidak ditentukan
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
