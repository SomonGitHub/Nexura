import React, { useState, useEffect, useRef } from 'react';
import { Camera } from 'lucide-react';
import type { Connection } from 'home-assistant-js-websocket';
import Hls from 'hls.js';
import './CameraContent.css';

interface CameraContentProps {
    entity: any;
    connection?: Connection | null; // From App.tsx
}

export const CameraContent: React.FC<CameraContentProps> = ({ entity, connection }) => {
    const [streamUrl, setStreamUrl] = useState<string | null>(null);
    const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Refresh strategy
    useEffect(() => {
        let mounted = true;

        const initCamera = async () => {
            if (!entity?.entity_id) return;
            
            try {
                // 1. Try to request an HLS stream token from HA
                if (connection) {
                    try {
                        const response = await connection.sendMessagePromise({
                            type: 'camera/stream',
                            entity_id: entity.entity_id,
                        }) as { url: string };

                        if (mounted && response && response.url) {
                            setStreamUrl(response.url);
                            return; // Success, we have an HLS stream
                        }
                    } catch (err) {
                        console.warn("[Nexura Camera] HLS stream not available for this camera. Falling back to picture.", err);
                    }
                }
                
                // 2. Fallback to token-based entity_picture if stream fails or no connection
                const pictureUrl = entity?.attributes?.entity_picture;
                if (mounted && pictureUrl) {
                    // Ensure absolute URL if possible. Sometimes iframe relative proxies fail
                    // to authenticate correctly leading to 500 or 401 errors.
                    let finalUrl = pictureUrl;
                    
                    // If running inside Home Assistant iframe, relative paths like /api/camera_proxy/... 
                    // work natively without needing to prepend the HASS URL because the browser 
                    // resolves them against the origin.
                    // However, if we appended it manually and the auth was wrong, it caused CORS/500s.
                    // We will just use the exact pictureUrl HA provides.
                    setFallbackUrl(finalUrl);
                }
            } catch (globalErr) {
                console.error("[Nexura Camera] Fatal error initializing camera:", globalErr);
            }
        };

        initCamera();

        return () => { mounted = false; };
    }, [entity, connection]);

    // Setup HLS.js when streamUrl is available
    useEffect(() => {
        if (!streamUrl || !videoRef.current) return;

        const video = videoRef.current;
        let hls: Hls | null = null;

        if (Hls.isSupported()) {
            hls = new Hls({
                liveDurationInfinity: true,
                liveBackBufferLength: 0,
            });
            hls.loadSource(streamUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play().catch(e => console.warn("Auto-play blocked", e));
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari)
            video.src = streamUrl;
            video.addEventListener('loadedmetadata', () => {
                video.play().catch(e => console.warn("Auto-play blocked", e));
            });
        }

        return () => {
            if (hls) hls.destroy();
        };
    }, [streamUrl]);

    const [imgError, setImgError] = useState(false);

    // Auto-retry picture on error after 10s
    useEffect(() => {
        if (imgError && fallbackUrl) {
            const timer = setTimeout(() => {
                setImgError(false);
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [imgError, fallbackUrl]);

    if (!entity && !streamUrl && !fallbackUrl) {
        return (
            <div className="camera-content empty">
                <Camera size={48} className="camera-icon-empty" />
                <p>Aucun flux vidéo disponible</p>
            </div>
        );
    }

    if (imgError) {
        return (
            <div className="camera-content empty">
                <Camera size={48} className="camera-icon-empty" />
                <p>Vidéo indisponible</p>
            </div>
        );
    }

    return (
        <div className="camera-content has-feed">
            {streamUrl ? (
                <video 
                    ref={videoRef}
                    className="camera-feed"
                    autoPlay
                    muted
                    playsInline
                    controls={false}
                />
            ) : (
                // Force a pseudo-refresh query parameter only on retry to avoid HA proxy strict token errors,
                // but keep the original token intact if it hasn't errored yet.
                <img 
                    src={fallbackUrl || ''} 
                    alt={entity?.attributes?.friendly_name || "Camera picture"} 
                    className="camera-feed"
                    onError={() => setImgError(true)}
                />
            )}
        </div>
    );
};
