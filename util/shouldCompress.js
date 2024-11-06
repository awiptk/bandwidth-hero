const MIN_COMPRESS_LENGTH = 1024;
const MIN_TRANSPARENT_COMPRESS_LENGTH = MIN_COMPRESS_LENGTH * 100;

function shouldCompress(originType, originSize) {
    // Jika bukan tipe gambar atau ukuran file 0, tidak perlu dikompres
    if (!originType.startsWith("image") || originSize === 0) return false;

    // Tidak kompresi jika ukuran lebih kecil dari batas minimal
    if (originSize < MIN_COMPRESS_LENGTH) return false;

    // Jika gambar PNG atau GIF dan ukurannya lebih kecil dari batas kompresi, tidak perlu dikompres
    if ((originType.endsWith("png") || originType.endsWith("gif")) && originSize < MIN_TRANSPARENT_COMPRESS_LENGTH) {
        return false;
    }

    return true;
}

module.exports = shouldCompress;
