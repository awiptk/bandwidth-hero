const pick = require("../util/pick");
const fetch = require("node-fetch");
const shouldCompress = require("../util/shouldCompress");
const compress = require("../util/compress");

const DEFAULT_QUALITY = 90;  // Mengatur kualitas default menjadi 70
const DEFAULT_MAX_WIDTH = 500;  // Mengatur lebar maksimum gambar menjadi 200px

exports.handler = async (event, context) => {
    let { url } = event.queryStringParameters;
    const { jpeg, bw, l, w } = event.queryStringParameters;  // Tambahkan parameter 'w' untuk maxWidth

    if (!url) {
        return {
            statusCode: 200,
            body: "bandwidth-hero-proxy"
        };
    }

    try {
        url = JSON.parse(url);  // Jika string sederhana, akan tetap menjadi string
    } catch { }

    if (Array.isArray(url)) {
        url = url.join("&url=");
    }

    url = url.replace(/http:\/\/1\.1\.\d\.\d\/bmi\/(https?:\/\/)?/i, "http://");

    const webp = !jpeg;
    const grayscale = bw != 0;
    const quality = parseInt(l, 10) || DEFAULT_QUALITY;
    const maxWidth = parseInt(w, 10) || DEFAULT_MAX_WIDTH;  // Mengatur maxWidth berdasarkan parameter atau default 200

    try {
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
                };
            }

            response_headers = res.headers;
            return {
                data: await res.buffer(),
                type: res.headers.get("content-type") || ""
            };
        });

        const originSize = data.length;

        if (shouldCompress(originType, originSize, webp)) {
            const { err, output, headers } = await compress(data, webp, grayscale, quality, originSize, maxWidth);  // Tambahkan maxWidth ke fungsi compress

            if (err) {
                console.log("Conversion failed: ", url);
                throw err;
            }

            console.log(`From ${originSize}, Saved: ${(originSize - output.length)/originSize}%`);
            const encoded_output = output.toString('base64');
            return {
                statusCode: 200,
                body: encoded_output,
                isBase64Encoded: true,
                headers: {
                    "content-encoding": "identity",
                    ...response_headers,
                    ...headers
                }
            };
        } else {
            console.log("Bypassing... Size: ", data.length);
            return {
                statusCode: 200,
                body: data.toString('base64'),
                isBase64Encoded: true,
                headers: {
                    "content-encoding": "identity",
                    ...response_headers,
                }
            };
        }
    } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            body: err.message || ""
        };
    }
};
