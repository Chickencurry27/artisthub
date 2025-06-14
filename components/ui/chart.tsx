"use client"

interface ChartData {
  name: string
  value: number
  color?: string
}

interface BarChartProps {
  data: ChartData[]
  height?: number
  className?: string
}

export function BarChart({ data, height = 200, className }: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value))
  const barWidth = 100 / data.length - 2 // 2% gap between bars

  return (
    <div className={`w-full ${className}`}>
      <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
        {data.map((item, index) => {
          const barHeight = maxValue > 0 ? (item.value / maxValue) * (height - 40) : 0
          const x = index * (100 / data.length) + 1
          const y = height - barHeight - 20

          return (
            <g key={item.name}>
              <rect
                x={`${x}%`}
                y={y}
                width={`${barWidth}%`}
                height={barHeight}
                fill={item.color || "hsl(var(--primary))"}
                className="transition-all duration-300 hover:opacity-80"
              />
              <text
                x={`${x + barWidth / 2}%`}
                y={height - 5}
                textAnchor="middle"
                fontSize="8"
                fill="currentColor"
                className="text-xs"
              >
                {item.name}
              </text>
              <text
                x={`${x + barWidth / 2}%`}
                y={y - 5}
                textAnchor="middle"
                fontSize="10"
                fill="currentColor"
                className="text-xs font-medium"
              >
                {item.value}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

interface PieChartProps {
  data: ChartData[]
  size?: number
  className?: string
}

export function PieChart({ data, size = 200, className }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const radius = size / 2 - 20
  const centerX = size / 2
  const centerY = size / 2

  let currentAngle = 0

  if (total === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <div className="text-center text-muted-foreground">
          <div className="text-2xl">📊</div>
          <div className="text-sm">No data</div>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <svg width={size} height={size}>
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100
          const angle = (item.value / total) * 360
          const startAngle = currentAngle
          const endAngle = currentAngle + angle

          const startAngleRad = (startAngle * Math.PI) / 180
          const endAngleRad = (endAngle * Math.PI) / 180

          const x1 = centerX + radius * Math.cos(startAngleRad)
          const y1 = centerY + radius * Math.sin(startAngleRad)
          const x2 = centerX + radius * Math.cos(endAngleRad)
          const y2 = centerY + radius * Math.sin(endAngleRad)

          const largeArcFlag = angle > 180 ? 1 : 0

          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            "Z",
          ].join(" ")

          currentAngle += angle

          return (
            <g key={item.name}>
              <path
                d={pathData}
                fill={item.color || `hsl(${(index * 137.5) % 360}, 70%, 50%)`}
                className="transition-all duration-300 hover:opacity-80"
              />
            </g>
          )
        })}
      </svg>
      <div className="mt-4 space-y-2">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color || `hsl(${(index * 137.5) % 360}, 70%, 50%)` }}
            />
            <span className="flex-1">{item.name}</span>
            <span className="font-medium">{item.value}</span>
            <span className="text-muted-foreground">({total > 0 ? Math.round((item.value / total) * 100) : 0}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface LineChartProps {
  data: { name: string; value: number }[]
  height?: number
  className?: string
}

export function LineChart({ data, height = 200, className }: LineChartProps) {
  if (data.length === 0) return null

  const maxValue = Math.max(...data.map((d) => d.value))
  const minValue = Math.min(...data.map((d) => d.value))
  const range = maxValue - minValue || 1

  const points = data
    .map((item, index) => {
      const x = (index / (data.length - 1)) * 100
      const y = height - 40 - ((item.value - minValue) / range) * (height - 60)
      return `${x},${y}`
    })
    .join(" ")

  return (
    <div className={`w-full ${className}`}>
      <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          className="transition-all duration-300"
        />
        {data.map((item, index) => {
          const x = (index / (data.length - 1)) * 100
          const y = height - 40 - ((item.value - minValue) / range) * (height - 60)

          return (
            <g key={item.name}>
              <circle
                cx={`${x}%`}
                cy={y}
                r="3"
                fill="hsl(var(--primary))"
                className="transition-all duration-300 hover:r-4"
              />
              <text x={`${x}%`} y={height - 5} textAnchor="middle" fontSize="8" fill="currentColor" className="text-xs">
                {item.name}
              </text>
              <text
                x={`${x}%`}
                y={y - 10}
                textAnchor="middle"
                fontSize="10"
                fill="currentColor"
                className="text-xs font-medium"
              >
                {item.value}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
