import { useItems, useStats } from "../api/hooks";
import {
  Chart as ChartJS,
  DoughnutController,
  LinearScale,
  CategoryScale,
  TimeScale,
  BarElement,
  ArcElement,
  BarController,
  PointElement,
  Legend,
  Tooltip,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import "chartjs-adapter-date-fns";
import { StatsCard } from "../components/stats_card";
import Grid from "@mui/material/Grid";
import { useGlobalStore } from "../hooks/global_store";
import { ItemModel } from "../api/models";
import { differenceInMonths } from "date-fns";

ChartJS.register(
  LinearScale,
  CategoryScale,
  TimeScale,
  BarElement,
  ArcElement,
  BarController,
  PointElement,
  DoughnutController,
  Legend,
  Tooltip,
);

function itemsCountLastLoan(items: ItemModel[]) {
  // Count each element in items by the difference in months between item.LastLoan and now
  const now = new Date();
  return items.reduce((counts: Record<number, number>, item: ItemModel) => {
    if (item.enabled && !item.big && !item.outside) {
      const nbmonths =
        6 *
        Math.ceil(
          Math.max(0.01, differenceInMonths(now, item.loanstop || "")) / 6,
        );
      counts[nbmonths] = (counts[nbmonths] || 0) + 1;
    }
    return counts;
  }, {});
}

function displaySign(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    signDisplay: "exceptZero",
  }).format(value);
}

export function Stats() {
  const { info } = useGlobalStore();
  const { items } = useItems();
  const { stats } = useStats();

  if (!stats || !items) return "Loading";

  const itemsPerLastLoan = itemsCountLastLoan(Array.from(items.values()));
  const gdata_itemsPerLastLoan = {
    labels: Object.keys(itemsPerLastLoan).map((i) =>
      i == "NaN" ? "Jamais emprunté" : `- de ${i} mois`,
    ),
    datasets: [
      {
        label: "Jeux",
        data: Object.values(itemsPerLastLoan),
        backgroundColor: [
          "oklch(0.8 0.1 255)",
          "oklch(0.7 0.1 255)",
          "oklch(0.6 0.1 255)",
          "oklch(0.5 0.1 255)",
          "oklch(0.4 0.1 255)",
          "oklch(0.3 0.1 255)",
        ],
      },
    ],
  };

  const lastday = Object.keys(stats).pop();
  if (!lastday) return "Erreur serveur";

  const laststats = stats[lastday];
  const gdata = {
    labels: Object.keys(stats),
    datasets: [
      {
        label: "Empruntés",
        backgroundColor: "oklch(0.8 0.1 255)", // "#9d5",
        data: Object.values(stats).map((i) => i.items.out),
      },
      {
        label: "Rendus",
        backgroundColor: "oklch(0.4 0.1 255)", // "#2cb",
        data: Object.values(stats).map((i) => i.items.in),
      },
    ],
  };
  return (
    <Grid container spacing={2}>
      <Grid size={4}>
        <StatsCard
          title="Jeux empruntés"
          value={`${laststats.items.totalout}(${displaySign(laststats.items.out - laststats.items.in)})`}
        />
      </Grid>
      <Grid size={4}>
        <StatsCard title="Jeux au total" value={info.nbitems} />
      </Grid>
      <Grid size={4}>
        <StatsCard title="Personnes (mois)" value={laststats.users.month} />
      </Grid>
      <Grid size={12}>
        <StatsCard
          title="Permanences"
          value={
            <Chart
              type="bar"
              data={gdata}
              options={{
                scales: {
                  x: {
                    type: "time",
                    time: {
                      unit: "month",
                    },
                  },
                },
              }}
            />
          }
        />
      </Grid>

      <Grid size={12}>
        <StatsCard
          title="Date de dernier emprunt des jeux"
          value={<Chart type="doughnut" data={gdata_itemsPerLastLoan} />}
        />
      </Grid>
    </Grid>
  );
}
