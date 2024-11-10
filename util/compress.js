const sharp = require("sharp");

function compress(input, webp, grayscale, quality, originSize, maxWidth = 200) {
    const format = webp ? "webp" : "jpeg";  // Memilih format berdasarkan parameter webp

    // Kompres dan resize gambar, atur lebar maksimum sesuai dengan maxWidth
    return sharp(input)
        .resize({ width: maxWidth, withoutEnlargement: true })  // Menjaga agar gambar tidak lebih besar dari ukuran aslinya
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
