const pick = require("../util/pick");
const fetch = require("node-fetch");
const shouldCompress = require("../util/shouldCompress");
const compress = require("../util/compress");

const DEFAULT_QUALITY = 85;
const MAX_WIDTH = 300;
const MAX_FILE_SIZE = 2 * 1024 * 1024; // Batasi ukuran file maksimal 2MB

exports.handler = async (event, context) => {
    let { url } = event.queryStringParameters;
    const { jpeg, bw, l } = event.queryStringParameters;

    if (!url) {
        return {
            statusCode: 200,
            body: "bandwidth-hero-proxy"
        };
    }

    try {
        // Logging untuk memastikan URL yang diterima
        console.log('Received URL:', url);

        // Menangani karakter khusus dalam URL
        // Langkah 1: Decode URL
        url = decodeURIComponent(url);

        // Langkah 2: Encode URL agar karakter-karakter spesial ter-handle dengan benar
        url = encodeURI(url);  // Meng-encode URL

        // Logging untuk melihat URL setelah encoding
        console.log('Encoded URL:', url);

        // Proses URL yang sudah di-decode dan di-encode
        url = url.replace(/http:\/\/1\.1\.\d\.\d\/bmi\/(https?:\/\/)?/i, "http://");

        const webp = !jpeg;
        const grayscale = false;
        const quality = parseInt(l, 10) || DEFAULT_QUALITY;

        let response_headers = {};
        const { data, type: originType } = await fetch(url, {
            headers: {
                ...pick(event.headers, ['cookie', 'dnt', 'referer']),
                'user-agent': 'Bandwidth-Hero Compressor',
                'x-forwarded-for': event.headers['x-forwarded-for'] || event.ip,
                via: '1.1 bandwidth-hero'
            }
        }).then(async res => {
            if (!res.ok) {
                return {
                    statusCode: res.status || 302
                }
            }

            response_headers = res.headers;
            const imageData = await res.buffer();
            return {
                data: imageData,
                type: res.headers.get("content-type") || ""
            }
        });

        const originSize = data.length;

        // Cek jika ukuran gambar melebihi batas ukuran file (misal 2MB)
        if (originSize > MAX_FILE_SIZE) {
            console.log(`Image size exceeds limit of ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
            return {
                statusCode: 400,
                body: `Image size exceeds the limit of ${MAX_FILE_SIZE / 1024 / 1024}MB.`
            };
        }

        if (shouldCompress(originType, originSize, webp)) {
            const { err, output, headers } = await compress(data, webp, grayscale, quality, originSize, MAX_WIDTH);

            if (err) {
                console.log("Conversion failed: ", url);
                throw err;
            }

            console.log(`From ${originSize}, Saved: ${(originSize - output.length)/originSize}%`);
            return {
                statusCode: 200,
                body: output,  // output dalam format buffer biner
                isBase64Encoded: false,
                headers: {
                    "content-encoding": "identity",
                    ...response_headers,
                    ...headers
                }
            }
        } else {
            return {
                statusCode: 200,
                body: data,  // output dalam format buffer biner
                isBase64Encoded: false,
                headers: {
                    "content-encoding": "identity",
                    ...response_headers,
                }
            }
        }
    } catch (err) {
        console.error("Handler error:", err);
        return {
            statusCode: 500,
            body: err.message || ""
        }
    }
}
