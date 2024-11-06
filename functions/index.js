const pick = require("../util/pick");
const fetch = require("node-fetch");
const shouldCompress = require("../util/shouldCompress");
const sharp = require("sharp"); // Import sharp
const compress = require("../util/compress");

const DEFAULT_QUALITY = 40;
const MAX_WIDTH = 300;

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
        url = JSON.parse(url);  // if simple string, then will remain so 
    } catch { }

    if (Array.isArray(url)) {
        url = url.join("&url=");
    }

    // by now, url is a string
    url = url.replace(/http:\/\/1\.1\.\d\.\d\/bmi\/(https?:\/\/)?/i, "http://");

    const quality = parseInt(l, 10) || DEFAULT_QUALITY;

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

        if (shouldCompress(originType, originSize)) {
            const { err, output, headers } = await compress(data, quality, originSize, MAX_WIDTH);   // compress

            if (err) {
                console.log("Conversion failed: ", url);
                throw err;
            }

            console.log(`From ${originSize}, Saved: ${(originSize - output.length) / originSize}%`);
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
            return {    // bypass
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

// Fungsi compress dengan resize gambar menggunakan sharp dan konversi ke JPEG
const compress = async (data, quality, originSize, maxWidth) => {
    try {
        let image = sharp(data);

        // Resize gambar jika lebarnya lebih besar dari MAX_WIDTH
        const metadata = await image.metadata();
        if (metadata.width > maxWidth) {
            image = image.resize(maxWidth);  // Resize gambar agar lebar tidak melebihi MAX_WIDTH
            console.log(`Gambar di-resize, lebar baru: ${maxWidth}px`);
        }

        // Konversi gambar ke format JPEG dengan kualitas yang ditentukan
        image = image.jpeg({ quality });

        // Simpan gambar yang telah diproses dan kembalikan
        const outputBuffer = await image.toBuffer();
        const headers = {
            'Content-Type': 'image/jpeg', // Atur header konten sesuai format gambar yang dihasilkan
        };

        return { err: null, output: outputBuffer, headers };

    } catch (err) {
        return { err };
    }
};
