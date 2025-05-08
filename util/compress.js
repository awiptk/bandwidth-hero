const sharp = require("sharp");

/**
 * Kompresi gambar hanya berdasarkan lebar dan tinggi tanpa pengaturan kualitas.
 * @param {Buffer} input - Data gambar dalam bentuk buffer.
 * @param {boolean} webp - Gunakan format WebP jika true, JPEG jika false.
 * @param {boolean} grayscale - Konversi ke grayscale jika true.
 * @param {number} width - Lebar target.
 * @param {number} height - Tinggi target.
 * @param {number} originSize - Ukuran asli gambar.
 * @returns {Promise<Object>} Hasil kompresi atau error.
 */
function compress(input, webp, grayscale, width, height, originSize) {
    const format = webp ? "webp" : "jpeg";

    return sharp(input)
        .resize({ width, height })
        .grayscale(grayscale)
        .toFormat(format, {
            progressive: true,
            optimizeScans: true
        })
        .toBuffer({ resolveWithObject: true })
        .then(({ data: output, info }) => ({
            err: null,
            headers: {
                "content-type": `image/${format}`,
                "content-length": info.size,
                "x-original-size": originSize,
                "x-bytes-saved": originSize - info.size
            },
            output
        }))
        .catch(err => ({ err }));
}

module.exports = compress;
