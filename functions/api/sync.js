/**
 * Nexura API - Cloudflare Pages Function
 * Handles data synchronization using Cloudflare D1.
 */

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        // 1. Get Profile
        const profile = await env.DB.prepare("SELECT * FROM profiles WHERE id = ?")
            .bind(userId)
            .first();

        // 2. Get Rooms
        const { results: rooms } = await env.DB.prepare("SELECT * FROM rooms WHERE user_id = ?")
            .bind(userId)
            .all();

        // 3. Get Entities
        const { results: entities } = await env.DB.prepare("SELECT * FROM entities WHERE user_id = ?")
            .bind(userId)
            .all();

        return new Response(JSON.stringify({
            profile: profile || null,
            rooms: rooms || [],
            entities: entities || []
        }), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const { userId, type, data } = await request.json();

    if (!userId || !type || !data) {
        return new Response("Bad Request", { status: 400 });
    }

    try {
        if (type === 'profile') {
            await env.DB.prepare(`
                INSERT INTO profiles (id, tier, dashboard_config, ha_url, ha_token_enc, ha_entity_energy, theme, tuya_client_id, tuya_secret_enc, tuya_region, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(id) DO UPDATE SET
                tier = EXCLUDED.tier,
                dashboard_config = EXCLUDED.dashboard_config,
                ha_url = EXCLUDED.ha_url,
                ha_token_enc = EXCLUDED.ha_token_enc,
                ha_entity_energy = EXCLUDED.ha_entity_energy,
                theme = EXCLUDED.theme,
                tuya_client_id = EXCLUDED.tuya_client_id,
                tuya_secret_enc = EXCLUDED.tuya_secret_enc,
                tuya_region = EXCLUDED.tuya_region,
                updated_at = EXCLUDED.updated_at
            `).bind(
                userId,
                data.tier,
                JSON.stringify(data.dashboard_config),
                data.ha_url,
                data.ha_token_enc,
                data.ha_entity_energy,
                data.theme,
                data.tuya_client_id || null,
                data.tuya_secret_enc || null,
                data.tuya_region || null
            ).run();
        }
        else if (type === 'rooms') {
            // Transactional update for rooms
            const statements = data.map(room => env.DB.prepare(`
                INSERT INTO rooms (id, user_id, name) VALUES (?, ?, ?)
                ON CONFLICT(id, user_id) DO UPDATE SET name = EXCLUDED.name
            `).bind(room.id, userId, room.name));

            await env.DB.batch(statements);
        }
        else if (type === 'entities') {
            const statements = data.map(e => env.DB.prepare(`
                INSERT INTO entities (haid, user_id, name, type, variant, roomid) VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(haid, user_id) DO UPDATE SET
                name = EXCLUDED.name,
                type = EXCLUDED.type,
                variant = EXCLUDED.variant,
                roomid = EXCLUDED.roomid
            `).bind(e.haId, userId, e.name, e.type, e.variant || null, e.roomId || null));

            await env.DB.batch(statements);
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
