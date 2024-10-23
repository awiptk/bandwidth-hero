const sharp = require("sharp");
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');

function compress(input, webp, grayscale, quality, originSize, maxWidth) {
    const format = webp ? "webp" : "jpeg";

    return sharp(input)
        .resize({ width: maxWidth, kernel: sharp.kernel.lanczos3 })  // Gunakan filter Lanczos3 untuk hasil resize halus
        .grayscale(grayscale)
        .toFormat(format, {
            quality: quality,  // Kualitas kompresi yang lebih tinggi
            progressive: false,  // Nonaktifkan progressive untuk kualitas maksimum
            optimizeScans: true
        })
        .toBuffer({ resolveWithObject: true })
        .then(async ({ data: output, info }) => {
            // Jika format adalah JPEG, kita lakukan kompresi tambahan menggunakan Imagemin
            if (format === "jpeg") {
                output = await imagemin.buffer(output, {
                    plugins: [
                        imageminMozjpeg({ quality: quality })  // Gunakan Imagemin untuk kompresi JPEG yang lebih baik
                    ]
                });
            }

            return {
                err: null,
                headers: {
                    "content-type": `image/${format}`,
                    "content-length": output.length,
                    "x-original-size": originSize,
                    "x-bytes-saved": originSize - output.length,
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
