/**
 * Tuya API Proxy for Nexura
 * Handles signing and communication with Tuya IoT Cloud.
 */

async function calculateSign(clientId, secret, timestamp, accessToken, body = "", method = "GET", url = "") {
    const contentHash = await sha256(body);
    const headers = "";
    const resource = url;
    const stringToSign = `${method}\n${contentHash}\n${headers}\n${resource}`;
    const strToSign = clientId + accessToken + timestamp + stringToSign;
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
    const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, msgData);
    return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const { userId, tuyaPath, method, body, accessToken } = await request.json();

    if (!userId || !tuyaPath || !accessToken) {
        return new Response("Bad Request", { status: 400 });
    }

    try {
        const profile = await env.DB.prepare("SELECT tuya_client_id, tuya_secret_enc, tuya_region FROM profiles WHERE id = ?")
            .bind(userId)
            .first();

        if (!profile) return new Response("Profile not found", { status: 404 });

        const t = Date.now().toString();
        const clientId = profile.tuya_client_id;
        const secret = profile.tuya_secret_enc;
        const region = profile.tuya_region || "eu";
        const host = `https://openapi.tuya${region}.com`;

        const stringBody = body ? JSON.stringify(body) : "";
        const sign = await calculateSign(clientId, secret, t, accessToken, stringBody, method || "GET", tuyaPath);

        const response = await fetch(host + tuyaPath, {
            method: method || "GET",
            headers: {
                "client_id": clientId,
                "access_token": accessToken,
                "sign": sign,
                "t": t,
                "sign_method": "HMAC-SHA256",
                "Content-Type": "application/json"
            },
            body: method === "POST" ? stringBody : undefined
        });

        const data = await response.json();
        return new Response(JSON.stringify(data), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
