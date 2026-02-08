import React, { useMemo, useState, useRef } from 'react';
import { AnchorPoint } from '../contexts/GameContext';

interface LifeGraphProps {
  anchorPoints: AnchorPoint[];
  onPointClick?: (age: number, score: number) => void;
  interactive?: boolean;
  maxAge: number;
  highlightAges?: any[]; // 柔軟に受け取れるように変更
  investorPoints?: { age: number; type: 'buy' | 'sell'; color: string; name: string }[];
  showLabels?: boolean;
  revealProgress?: number; // 公開アニメーション用
}

export function LifeGraph({ 
  anchorPoints, 
  onPointClick, 
  interactive = false, 
  maxAge = 100,
  highlightAges = [],
  investorPoints = [],
  showLabels = true,
  revealProgress = 100
}: LifeGraphProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{ age: number; score: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const width = 800;
  const height = 400;
  const padding = { top: 40, right: 40, bottom: 50, left: 60 }; // bottomを少し詰める

  const chartWidth = Math.max(1, width - padding.left - padding.right);
  const chartHeight = Math.max(1, height - padding.top - padding.bottom);

  const safeMaxAge = Math.max(1, maxAge);

  // 年齢からX座標への変換
  const getX = (age: number) => (age / safeMaxAge) * chartWidth + padding.left;
  // スコアからY座標への変換 (スコア100が上、0が下)
  const getY = (score: number) => ((100 - score) / 100) * chartHeight + padding.top;

  const getAgeAndScoreFromEvent = (e: React.MouseEvent | React.TouchEvent) => {
    if (!svgRef.current) return null;
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // SVG内の座標系に変換
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    // クリック判定範囲を拡張（0歳や最大年齢をタップしやすくするため）
    const buffer = 20;
    if (x < padding.left - buffer || x > width - padding.right + buffer || y < padding.top - buffer || y > height - padding.bottom + buffer) {
      return null;
    }

    const age = Math.round(((x - padding.left) / chartWidth) * maxAge);
    const score = Math.round(100 - ((y - padding.top) / chartHeight) * 100);

    return {
      age: Math.max(0, Math.min(maxAge, age)),
      score: Math.max(0, Math.min(100, score))
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!interactive) return;
    const coords = getAgeAndScoreFromEvent(e);
    setHoveredPoint(coords);
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!interactive || !onPointClick) return;
    const coords = getAgeAndScoreFromEvent(e);
    if (coords) {
      onPointClick(coords.age, coords.score);
    }
  };

  // 表示ラベルの間隔決定ロジック (1歳刻みを基本とし、最大年齢に応じて調整)
  const labelInterval = useMemo(() => {
    if (maxAge <= 30) return 1;
    if (maxAge <= 60) return 5;
    return 10;
  }, [maxAge]);

  // グリッド線の生成
  const gridLines = useMemo(() => {
    const lines = [];
    // 縦軸 (1歳ごと)
    for (let i = 0; i <= maxAge; i++) {
      const x = getX(i);
      const isLabelAge = i % labelInterval === 0 || i === maxAge;
      
      // グリッド線は常時表示 (ラベル表示位置は少し強調)
      lines.push(
        <line
          key={`grid-v-${i}`}
          x1={x}
          y1={padding.top}
          x2={x}
          y2={height - padding.bottom}
          stroke={isLabelAge ? "rgba(0,0,0,0.1)" : "rgba(0,0,0,0.05)"}
          strokeWidth={isLabelAge ? 1 : 0.5}
        />
      );
    }
    // 横軸 (20ポイントごと)
    for (let i = 0; i <= 100; i += 20) {
      const y = getY(i);
      lines.push(
        <line
          key={`grid-h-${i}`}
          x1={padding.left}
          y1={y}
          x2={width - padding.right}
          y2={y}
          stroke="rgba(0,0,0,0.05)"
          strokeWidth={1}
        />
      );
    }
    return lines;
  }, [maxAge, labelInterval]);

  const sortedPoints = useMemo(() => [...anchorPoints].sort((a, b) => a.age - b.age), [anchorPoints]);
  
  const visibleMaxAge = (revealProgress / 100) * maxAge;

  const linePath = useMemo(() => {
    if (sortedPoints.length < 2) return "";
    return sortedPoints.reduce((path, point, i) => {
      if (point.age > visibleMaxAge && !interactive) return path;
      const x = getX(point.age);
      const y = getY(point.score);
      return path + (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
    }, "");
  }, [sortedPoints, maxAge, visibleMaxAge, interactive]);

  const interpolateScore = (age: number) => {
    if (sortedPoints.length < 2) return 0;
    if (age <= sortedPoints[0].age) return sortedPoints[0].score;
    if (age >= sortedPoints[sortedPoints.length - 1].age) return sortedPoints[sortedPoints.length - 1].score;
    
    let i = 0;
    while (i < sortedPoints.length - 1 && sortedPoints[i + 1].age <= age) i++;
    
    const p1 = sortedPoints[i];
    const p2 = sortedPoints[i + 1];
    const t = (age - p1.age) / (p2.age - p1.age);
    return Math.round(p1.score + t * (p2.score - p1.score));
  };

  return (
    <div className="w-full h-full flex items-center justify-center relative select-none">
      <svg 
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`} 
        className={`w-full h-full max-h-full ${interactive ? 'cursor-crosshair' : ''}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="revealMask">
            <rect x="0" y="0" width={getX(visibleMaxAge)} height={height} />
          </clipPath>
        </defs>

        {/* 背景領域 */}
        <rect x={padding.left} y={padding.top} width={chartWidth} height={chartHeight} fill="transparent" />

        {/* グリッド */}
        {gridLines}

        {/* 軸のラベル */}
        {showLabels && (
          <g className="text-[12px] font-black select-none">
            {/* 縦軸ラベル */}
            {[0, 20, 40, 60, 80, 100].map(score => (
              <text key={`label-y-${score}`} x={padding.left - 15} y={getY(score)} textAnchor="end" alignmentBaseline="middle" className="fill-slate-400">
                {score}
              </text>
            ))}
            
            {/* 横軸ラベル (年齢) - 常時表示 */}
            {Array.from({ length: maxAge + 1 }).map((_, age) => {
              if (age % labelInterval !== 0 && age !== maxAge) return null;
              const x = getX(age);
              return (
                <text key={`label-x-${age}`} x={x} y={height - padding.bottom + 25} textAnchor="middle" className="fill-slate-600">
                  {age}
                </text>
              );
            })}
          </g>
        )}

        {/* アンカーポイント強調ライン (X軸への垂線) */}
        {showLabels && sortedPoints.map((point, i) => (
          point.age <= visibleMaxAge || interactive ? (
            <line
              key={`v-line-${i}`}
              x1={getX(point.age)}
              y1={getY(point.score)}
              x2={getX(point.age)}
              y2={height - padding.bottom}
              stroke="rgba(34,197,94,0.3)"
              strokeWidth="1"
              strokeDasharray="4 2"
            />
          ) : null
        ))}

        {/* グラフ曲線の下塗り */}
        {sortedPoints.length >= 2 && (
          <path
            d={`${linePath} L ${getX(Math.min(sortedPoints[sortedPoints.length - 1].age, visibleMaxAge))} ${height - padding.bottom} L ${getX(sortedPoints[0].age)} ${height - padding.bottom} Z`}
            fill="url(#areaGradient)"
            className="pointer-events-none"
            clipPath={interactive ? undefined : "url(#revealMask)"}
          />
        )}

        {/* メイン曲線 */}
        {sortedPoints.length >= 2 && (
          <path
            d={linePath}
            fill="none"
            stroke="#16a34a"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none"
            clipPath={interactive ? undefined : "url(#revealMask)"}
          />
        )}

        {/* アンカーポイント */}
        {sortedPoints.map((point, i) => (
          (point.age <= visibleMaxAge || interactive) && (
            <circle
              key={`point-${i}`}
              cx={getX(point.age)}
              cy={getY(point.score)}
              r="4"
              className="fill-white stroke-green-600 stroke-2 pointer-events-none"
            />
          )
        ))}

        {/* ハイライト表示 (売買ポイント) */}
        {(() => {
          const ageGroups: { [age: number]: number } = {};
          return investorPoints.map((p, i) => {
            const score = interpolateScore(p.age);
            const x = getX(p.age);
            const y = getY(score);
            
            // 重なり対策: 直径の20%以内（40px * 0.2 = 8px）のルールに配慮しつつ視認性を確保
            // 垂直方向のガイドラインを伴うずらし。旧サイズ(-18)の2倍相当の-36を検討するが、
            // 20%ルールを厳格に解釈すると垂直方向もずらし過ぎはNG。
            // しかし視認性優先のため、マーカーが重なりすぎないよう調整。
            const count = ageGroups[p.age] || 0;
            ageGroups[p.age] = count + 1;
            const offset = count * -36; // サイズ2倍に伴いオフセットも倍増

            return (
              <g 
                key={`investor-marker-${i}`} 
                filter="url(#glow)"
                className="cursor-pointer transition-transform active:scale-105"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                {/* 曲線上の正確な位置を示すガイドライン */}
                <line
                  x1={x}
                  y1={y}
                  x2={x}
                  y2={y + offset}
                  stroke={p.color}
                  strokeWidth="2"
                  strokeDasharray="3 2"
                  opacity="0.8"
                />
                {/* 曲線上の正確な位置を示すドット */}
                <circle cx={x} cy={y} r="3" fill={p.color} />
                
                <g transform={`translate(${x}, ${y + offset})`}>
                  {/* マーカー背景：旧サイズ(r=10)のちょうど2倍(r=20)の円形 */}
                  <circle 
                    r="20" 
                    fill={p.color} 
                    stroke="white" 
                    strokeWidth="3" 
                    className="shadow-lg"
                  />
                  
                  {/* 表示文字：旧サイズ(10px)のちょうど2倍(20px)の「買」「売」 */}
                  <text
                    y="1"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    className="text-[20px] font-black fill-white pointer-events-none"
                    style={{ 
                      filter: 'drop-shadow(0px 0px 2px rgba(0,0,0,0.8))'
                    }}
                  >
                    {p.type === 'buy' ? '買' : '売'}
                  </text>
                </g>
              </g>
            );
          });
        })()}

        {/* リアルタイム・フローティングラベル */}
        {interactive && hoveredPoint && (
          <g className="pointer-events-none">
            <line
              x1={getX(hoveredPoint.age)}
              y1={padding.top}
              x2={getX(hoveredPoint.age)}
              y2={height - padding.bottom}
              stroke="rgba(0,0,0,0.1)"
              strokeWidth="1"
            />
            {/* 文字サイズを約2倍に拡大し、視認性を大幅に向上。画面端での見切れ防止のため上下反転ロジックを追加 */}
            {(() => {
              const tx = getX(hoveredPoint.age);
              const ty = getY(hoveredPoint.score);
              const rectW = 160;
              const rectH = 80;
              // 画面上部での見切れを防ぐため、座標によって表示位置を上下反転
              const isTopHalf = ty < height / 2;
              const rectY = isTopHalf ? ty + 20 : ty - rectH - 20;
              
              return (
                <g>
                  <rect
                    x={tx - rectW / 2}
                    y={rectY}
                    width={rectW}
                    height={rectH}
                    rx="12"
                    fill="white"
                    className="shadow-2xl stroke-slate-200"
                    style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))' }}
                  />
                  <text
                    x={tx}
                    y={rectY + 32}
                    textAnchor="middle"
                    className="text-[24px] font-black fill-slate-900"
                  >
                    年齢：{hoveredPoint.age}歳
                  </text>
                  <text
                    x={tx}
                    y={rectY + 62}
                    textAnchor="middle"
                    className="text-[24px] font-bold fill-green-600"
                  >
                    スコア：{hoveredPoint.score}
                  </text>
                  <circle
                    cx={tx}
                    cy={ty}
                    r="8"
                    fill="none"
                    stroke="#16a34a"
                    strokeWidth="2"
                    className="animate-pulse"
                  />
                </g>
              );
            })()}
          </g>
        )}
      </svg>
    </div>
  );
}
