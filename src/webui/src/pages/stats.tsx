import { useStats } from "../api/hooks";
import {
  Chart as ChartJS,
  LinearScale,
  CategoryScale,
  TimeScale,
  BarElement,
  BarController,
  PointElement,
  LineElement,
  LineController,
  Legend,
  Tooltip,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import "chartjs-adapter-date-fns";

ChartJS.register(
  LinearScale,
  CategoryScale,
  TimeScale,
  BarElement,
  BarController,
  PointElement,
  LineElement,
  LineController,
  Legend,
  Tooltip,
);

export function Stats() {
  const { stats } = useStats();

  if (!stats) return "Loading";

  const lastday = Object.keys(stats).pop();
  if (!lastday) return "Erreur serveur";

  const laststats = stats[lastday];

  const gdata = {
    labels: Object.keys(stats),
    datasets: [
      {
        type: "line" as const,
        label: "Total de jeux empruntés",
        data: Object.values(stats).map((i) => i.items.totalout),
      },
      // },
      // // {
      // //   type: "line",
      // //   label: "Personne actives",
      // //   data: Object.values(stats).map(i => i.users.month)
      // // },
      {
        type: "bar" as const,
        label: "Empruntés",
        backgroundColor: "#EE7700",
        data: Object.values(stats).map((i) => i.items.out),
        barThickness: 10,
        stack: "indivitems",
      },
      {
        type: "bar" as const,
        label: "Rendus",
        backgroundColor: "#00AA00",
        data: Object.values(stats).map((i) => -i.items.in),
        barThickness: 10,
        stack: "indivitems",
      },
    ],
  };
  return (
    <>
      Jeux actuellement empruntés: {laststats.items.totalout}
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
    </>
  );
}
