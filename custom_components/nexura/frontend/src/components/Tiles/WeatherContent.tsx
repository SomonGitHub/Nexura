import React from 'react';
import { motion } from 'framer-motion';
import { DynamicIcon } from '../DynamicIcon/DynamicIcon';
import { getWeatherIcon } from '../../utils/entityMapping';
import type { HassEntity } from 'home-assistant-js-websocket';
import './WeatherContent.css';

interface WeatherContentProps {
    entity: HassEntity | null;
    size: string;
}

interface WeatherForecast {
    datetime: string;
    condition: string;
    temperature: number;
}

export const WeatherContent: React.FC<WeatherContentProps> = ({ entity, size }) => {
    if (!entity) return <div className="weather-empty">Aucune entité météo</div>;

    const state = entity.state;
    // ... rest of the code logic
    const temp = entity.attributes.temperature;
    const unit = entity.attributes.temperature_unit || '°C';
    const humidity = entity.attributes.humidity;
    const windSpeed = entity.attributes.wind_speed;
    const forecast = entity.attributes.forecast as WeatherForecast[];

    const isLarge = size.startsWith('large');

    // Background animation variants based on state
    const getBgClass = () => {
        switch (state) {
            case 'sunny':
            case 'clear-night': return 'bg-clear';
            case 'rainy':
            case 'pouring': return 'bg-rainy';
            case 'cloudy':
            case 'partlycloudy': return 'bg-cloudy';
            case 'snowy':
            case 'snowy-rainy': return 'bg-snowy';
            case 'lightning':
            case 'lightning-rainy': return 'bg-stormy';
            default: return 'bg-default';
        }
    };

    return (
        <div className={`weather-content ${getBgClass()} ${size}`}>
            <div className="weather-main">
                <div className="weather-header">
                    <DynamicIcon name={getWeatherIcon(state)} size={isLarge ? 48 : 32} />
                    <div className="temp-container">
                        <span className="temp-value">{temp}</span>
                        <span className="temp-unit">{unit}</span>
                    </div>
                </div>

                {!isLarge && (
                    <div className="weather-condition-text">
                        {state.replace('-', ' ')}
                    </div>
                )}

                {/* Humidity and Wind for all sizes */}
                <div className="weather-mini-details">
                    <div className="mini-detail">
                        <DynamicIcon name="Droplets" size={14} />
                        <span>{humidity}%</span>
                    </div>
                    <div className="mini-detail">
                        <DynamicIcon name="Wind" size={14} />
                        <span>{windSpeed} km/h</span>
                    </div>
                </div>
            </div>

            {isLarge && (
                <div className="weather-details">
                    {forecast && forecast.length > 0 && (
                        <div className="weather-forecast">
                            {forecast.slice(0, 4).map((f, i) => (
                                <div key={i} className="forecast-day">
                                    <span className="day-name">
                                        {new Date(f.datetime).toLocaleDateString([], { weekday: 'short' })}
                                    </span>
                                    <DynamicIcon name={getWeatherIcon(f.condition)} size={20} />
                                    <span className="day-temp">{Math.round(f.temperature)}°</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Animated particles/glow layer */}
            <div className="weather-effects">
                <motion.div
                    className="glow-effect"
                    animate={{
                        opacity: [0.3, 0.6, 0.3],
                        scale: [1, 1.2, 1]
                    }}
                    transition={{ duration: 5, repeat: Infinity }}
                />
            </div>
        </div>
    );
};
