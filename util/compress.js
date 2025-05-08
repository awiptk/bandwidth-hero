const sharp = require("sharp");

/**
 * Fungsi untuk mengompresi gambar dengan parameter tinggi gambar (height).
 * @param {Buffer} input - Data gambar dalam bentuk buffer.
 * @param {boolean} webp - Apakah ingin menggunakan format WebP.
 * @param {boolean} grayscale - Apakah ingin mengonversi gambar menjadi grayscale.
 * @param {number} height - Tinggi gambar yang diinginkan.
 * @param {number} originSize - Ukuran asli dari gambar.
 * @param {number} maxWidth - Lebar maksimum gambar.
 * @returns {Promise<Object>} Objek berisi hasil kompresi atau error.
 */
function compress(input, webp, grayscale, height, originSize, maxWidth) {
    const format = webp ? "webp" : "jpeg"; // Pilih format WebP atau JPEG.

    // Kompres dan resize gambar
    return sharp(input)
        .resize({ width: maxWidth, height: height })  // Resize gambar dengan lebar dan tinggi maksimum
        .grayscale(grayscale)                         // Ubah gambar menjadi grayscale jika diinginkan
        .toFormat(format, {                           // Format output gambar
            progressive: true,
            optimizeScans: true
        })
        .toBuffer({ resolveWithObject: true })        // Konversi ke buffer
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