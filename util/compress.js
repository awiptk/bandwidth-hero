const sharp = require("sharp");

function compress(input, grayscale, quality, originSize, maxWidth) {
    const format = "jpeg";  // Pakai format JPEG secara default

    // Kompres dan resize gambar, atur lebar maksimum menjadi 200px dengan filter Lanczos untuk hasil yang lebih halus
    return sharp(input)
        .resize({ width: maxWidth, kernel: sharp.kernel.lanczos3 })  // Menggunakan Lanczos untuk menjaga ketajaman
        .grayscale(grayscale)
        .toFormat(format, {
            quality: quality,  // Kualitas kompresi yang diterima dari `index.js`
            progressive: true,
            optimizeScans: true,
            mozjpeg: true,  // Gunakan mozJPEG untuk kompresi JPEG yang lebih efisien
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
        })
        .catch(err => {
            return {
                err: err
            };
        });
}

module.exports = compress;
