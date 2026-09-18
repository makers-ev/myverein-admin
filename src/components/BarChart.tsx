import { useId } from 'react';

export interface BarChartSeries {
    key: string;
    label: string;
    /** Tailwind fill class for the SVG bar segments, e.g. "fill-chart-new". */
    fillClass: string;
    /** Tailwind background class for the legend swatch, e.g. "bg-chart-new" -- `fill-*` only affects SVG `fill`, it does nothing on a plain HTML element, so the legend needs its own class. */
    bgClass: string;
}

export interface BarChartDatum {
    label: string;
    values: Record<string, number>;
}

interface BarChartProps {
    data: BarChartDatum[];
    series: BarChartSeries[];
    height?: number;
    /** CSP nonce from the incoming request (`x-nonce` header, see proxy.ts) --
     * required because this component's dynamic per-instance pixel/percent
     * values can't be expressed as static Tailwind classes, and a nonce on
     * `style-src` only covers `<style>` *elements*, not inline `style="..."`
     * *attributes* -- those are a separate CSP mechanism (`style-src-attr`)
     * that this app's strict-dynamic policy does not allow. So instead of
     * inline `style` props, this renders one scoped `<style nonce>` block
     * with uniquely-classed rules (see `uid` below). */
    nonce: string;
}

const CHART_PADDING = { top: 8, bottom: 20, left: 28 };

/**
 * Stacked multi-series bar chart, still hand-rolled SVG (no charting
 * dependency, see the original single-series version's comment) -- stacking
 * a handful of series and adding two axes is well within "a few dozen lines
 * of SVG", still not worth a package for a template meant to stay lean.
 */
export function BarChart({ data, series, height = 220, nonce }: BarChartProps) {
    // `useId()` gives a stable, unique-per-instance string, but it contains
    // colons (`:r0:`), invalid in a CSS class name -- strip them.
    const uid = useId().replace(/:/g, '');

    const totals = data.map((d) => series.reduce((sum, s) => sum + (d.values[s.key] ?? 0), 0));
    const max = Math.max(1, ...totals);
    const plotHeight = height - CHART_PADDING.top - CHART_PADDING.bottom;
    const barWidth = 100 / data.length;

    // Y-axis: 0, half, max -- enough to read the scale without cluttering a
    // chart that's often only a couple hundred px tall.
    const yTicks = [0, Math.round(max / 2), max];

    // X-axis: thin out labels so ~30 daily buckets don't overlap into mush.
    const labelEvery = Math.max(1, Math.ceil(data.length / 8));

    const tickRules = yTicks.map((tick, i) => {
        const topPercent = ((plotHeight - (tick / max) * plotHeight + CHART_PADDING.top) / height) * 100;
        return `.bc-${uid}-tick-${i} { top: ${topPercent}%; }`;
    });
    const scopedCss = [`.bc-${uid}-h { height: ${height}px; }`, ...tickRules].join(' ');

    return (
        <div>
            <style nonce={nonce}>{scopedCss}</style>
            <div className="flex">
                {/* Plain HTML, not SVG text -- the chart SVG below uses
                    preserveAspectRatio="none" (a 0-100 viewBox stretched to
                    the container's actual pixel width) so text glyphs
                    inside it would render horizontally squashed. */}
                <div className={`relative w-8 shrink-0 text-right bc-${uid}-h`} aria-hidden="true">
                    {yTicks.map((tick, i) => (
                        <span
                            key={tick}
                            className={`absolute right-1 -translate-y-1/2 text-[9px] text-muted-foreground bc-${uid}-tick-${i}`}
                        >
                            {tick}
                        </span>
                    ))}
                </div>

                <svg
                    viewBox={`0 0 100 ${height}`}
                    preserveAspectRatio="none"
                    className={`w-full flex-1 bc-${uid}-h`}>
                    {yTicks.map((tick) => {
                        const y = CHART_PADDING.top + plotHeight - (tick / max) * plotHeight;
                        return (
                            <line key={tick} x1="0" y1={y} x2="100" y2={y} className="stroke-border" strokeWidth={0.5} vectorEffect="non-scaling-stroke" />
                        );
                    })}

                    {data.map((d, i) => {
                        let stackedY = CHART_PADDING.top + plotHeight;
                        return (
                            <g key={i}>
                                {series.map((s) => {
                                    const value = d.values[s.key] ?? 0;
                                    const segmentHeight = (value / max) * plotHeight;
                                    const y = stackedY - segmentHeight;
                                    stackedY = y;
                                    return (
                                        <rect
                                            key={s.key}
                                            x={i * barWidth + barWidth * 0.15}
                                            y={y}
                                            width={barWidth * 0.7}
                                            height={Math.max(segmentHeight, value > 0 ? 1 : 0)}
                                            className={s.fillClass}
                                        >
                                            {/* Template string, not multiple JSX children -- React treats
                                                every <title> element (SVG tooltip included, not just
                                                document <head>) as needing a single string child. */}
                                            <title>{`${d.label} — ${s.label}: ${value}`}</title>
                                        </rect>
                                    );
                                })}
                            </g>
                        );
                    })}
                </svg>
            </div>

            <div className="ml-8 mt-1 flex justify-between text-[10px] text-muted-foreground">
                {data.map((d, i) =>
                    i % labelEvery === 0 || i === data.length - 1 ? <span key={i}>{d.label}</span> : <span key={i} />,
                )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-4">
                {series.map((s) => (
                    <div key={s.key} className="flex items-center gap-1.5">
                        <span className={`h-2.5 w-2.5 rounded-sm ${s.bgClass}`} />
                        <span className="text-xs text-muted-foreground">{s.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
