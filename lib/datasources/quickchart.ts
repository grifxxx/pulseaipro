export interface ChangeChartItem {
  ticker: string;
  changePct: number | null;
}

/** Builds a free, keyless QuickChart.io bar-chart image URL for a set of 24h price changes. */
export function buildChangeChartUrl(items: ChangeChartItem[], title: string): string | null {
  const points = items.filter((i): i is { ticker: string; changePct: number } => i.changePct != null);
  if (points.length === 0) return null;

  const config = {
    type: "bar",
    data: {
      labels: points.map((p) => p.ticker),
      datasets: [
        {
          label: "24h, %",
          data: points.map((p) => Number(p.changePct.toFixed(2))),
          backgroundColor: points.map((p) => (p.changePct >= 0 ? "#10b981" : "#f43f5e")),
        },
      ],
    },
    options: {
      plugins: {
        title: { display: true, text: title },
        legend: { display: false },
      },
    },
  };

  const params = new URLSearchParams({
    c: JSON.stringify(config),
    backgroundColor: "white",
    width: "700",
    height: "380",
    format: "png",
  });

  return `https://quickchart.io/chart?${params.toString()}`;
}
