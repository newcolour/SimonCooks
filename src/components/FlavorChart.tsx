import type { FlavorProfile } from '../types';
import type { Language } from '../i18n';
import { getTranslation } from '../i18n';
import './FlavorChart.css';

interface FlavorChartProps {
    flavorProfile: FlavorProfile;
    language: Language;
}

export function FlavorChart({ flavorProfile, language }: FlavorChartProps) {
    const t = getTranslation(language);

    const flavors = [
        { key: 'sweet', value: flavorProfile.sweet, label: t.recipe.sweet },
        { key: 'salty', value: flavorProfile.salty, label: t.recipe.salty },
        { key: 'sour', value: flavorProfile.sour, label: t.recipe.sour },
        { key: 'bitter', value: flavorProfile.bitter, label: t.recipe.bitter },
        { key: 'umami', value: flavorProfile.umami, label: t.recipe.umami },
        { key: 'spicy', value: flavorProfile.spicy, label: t.recipe.spicy },
    ];

    const numPoints = flavors.length;
    const angleStep = (2 * Math.PI) / numPoints;
    // Centered with more padding - viewBox is 400x340
    const centerX = 200;
    const centerY = 160;
    const maxRadius = 90;
    const labelRadius = 115;

    // Generate grid circles (levels)
    const gridLevels = [2, 4, 6, 8, 10];

    // Generate axis lines and label positions
    const axes = flavors.map((flavor, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const x = centerX + maxRadius * Math.cos(angle);
        const y = centerY + maxRadius * Math.sin(angle);
        const labelX = centerX + labelRadius * Math.cos(angle);
        const labelY = centerY + labelRadius * Math.sin(angle);

        // Determine text anchor based on position
        let textAnchor: 'middle' | 'end' | 'start' = 'middle';
        if (Math.cos(angle) < -0.1) textAnchor = 'end';
        else if (Math.cos(angle) > 0.1) textAnchor = 'start';

        // Adjust vertical offset for label value
        let valueOffset = 14;
        if (Math.sin(angle) < -0.5) valueOffset = 14; // top labels
        else if (Math.sin(angle) > 0.5) valueOffset = 14; // bottom labels

        return {
            ...flavor,
            lineX: x,
            lineY: y,
            labelX,
            labelY,
            textAnchor,
            valueOffset,
            angle,
        };
    });

    // Generate data points for the polygon
    const dataPoints = flavors.map((flavor, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const radius = (flavor.value / 10) * maxRadius;
        return {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
            value: flavor.value,
        };
    });

    // Create polygon path
    const polygonPath = dataPoints.map((p, i) =>
        `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`
    ).join(' ') + ' Z';

    return (
        <div className="flavor-chart-container">
            <svg viewBox="0 0 400 340" className="flavor-chart" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <linearGradient id="flavorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgba(249, 115, 22, 0.4)" />
                        <stop offset="100%" stopColor="rgba(236, 72, 153, 0.3)" />
                    </linearGradient>
                </defs>

                {/* Background grid circles */}
                {gridLevels.map(level => {
                    const radius = (level / 10) * maxRadius;
                    return (
                        <circle
                            key={level}
                            cx={centerX}
                            cy={centerY}
                            r={radius}
                            className="grid-circle"
                        />
                    );
                })}

                {/* Axis lines */}
                {axes.map((axis, i) => (
                    <line
                        key={i}
                        x1={centerX}
                        y1={centerY}
                        x2={axis.lineX}
                        y2={axis.lineY}
                        className="axis-line"
                    />
                ))}

                {/* Data polygon */}
                <path
                    d={polygonPath}
                    className="data-polygon"
                    fill="url(#flavorGradient)"
                />

                {/* Data points */}
                {dataPoints.map((point, i) => (
                    <circle
                        key={i}
                        cx={point.x}
                        cy={point.y}
                        r={5}
                        className="data-point"
                    />
                ))}

                {/* Labels */}
                {axes.map((axis, i) => (
                    <g key={i} className="flavor-label-group">
                        <text
                            x={axis.labelX}
                            y={axis.labelY}
                            textAnchor={axis.textAnchor}
                            dominantBaseline="middle"
                            className="flavor-label-text"
                        >
                            {axis.label}
                        </text>
                        <text
                            x={axis.labelX}
                            y={axis.labelY + axis.valueOffset}
                            textAnchor={axis.textAnchor}
                            dominantBaseline="middle"
                            className="flavor-label-value"
                        >
                            {axis.value}
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    );
}
