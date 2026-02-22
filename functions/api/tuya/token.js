/**
 * Tuya Authentication Helper for Nexura
 * Generates signatures and manages access tokens.
 */

async function calculateSign(clientId, secret, timestamp, accessToken = "", body = "", method = "GET", url = "/v1.0/token?grant_type=1") {
    // Basic sign for token request: HMAC-SHA256(clientId + t, secret)
    // Business sign: HMAC-SHA256(clientId + accessToken + t + nonce + stringToSign, secret)

    let strToSign = "";
    if (accessToken) {
        // Business Request
        const contentHash = await sha256(body);
        const headers = ""; // Tuya recommends empty headers for simple cases
        const resource = url;
        const stringToSign = `${method}\n${contentHash}\n${headers}\n${resource}`;
        strToSign = clientId + accessToken + timestamp + stringToSign;
    } else {
        // Token Request
        strToSign = clientId + timestamp;
    }

    return await hmacSha256(secret, strToSign);
}

async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacSha256(secret, message) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const msgData = encoder.encode(message);

    const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, msgData);
    return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) return new Response("Unauthorized", { status: 401 });

    try {
        // 1. Get Tuya Credentials from DB
        const profile = await env.DB.prepare("SELECT tuya_client_id, tuya_secret_enc, tuya_region FROM profiles WHERE id = ?")
            .bind(userId)
            .first();

        if (!profile || !profile.tuya_client_id || !profile.tuya_secret_enc) {
            return new Response(JSON.stringify({ error: "Tuya not configured" }), { status: 404 });
        }

        // 2. Prepare Tuya Request
        const t = Date.now().toString();
        const clientId = profile.tuya_client_id;
        const secret = profile.tuya_secret_enc; // Assuming for now it's plain or we decrypt it
        const region = profile.tuya_region || "eu"; // Default to EU

        const host = `https://openapi.tuya${region}.com`;
        const path = "/v1.0/token?grant_type=1";
        const sign = await calculateSign(clientId, secret, t);

        const response = await fetch(host + path, {
            headers: {
                "client_id": clientId,
                "sign": sign,
                "t": t,
                "sign_method": "HMAC-SHA256"
            }
        });

        const data = await response.json();
        return new Response(JSON.stringify(data), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
