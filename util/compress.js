const sharp = require("sharp");

function compress(input, webp, grayscale, quality, originSize, maxWidth = 100) {
    const format = webp ? "webp" : "jpeg";

    // Resize gambar dengan lebar maksimum 500px
    return sharp(input)
        .resize({ width: maxWidth, kernel: sharp.kernel.lanczos3 })  // Mempertahankan aspek rasio
        .grayscale(grayscale)
        .toFormat(format, {
            quality: quality || 50,  // Kualitas kompresi default ke 90
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
