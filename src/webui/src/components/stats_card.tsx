import { Card, CardContent, Typography } from "@mui/material";
import { ReactNode } from "react";

interface StatsCardProps {
  title?: string;
  value: string | number | ReactNode;
  columns?: number;
}

export function StatsCard(props: StatsCardProps) {
  return (
    <Card
      elevation={3}
      variant="outlined"
      sx={{
        textAlign: "center",
      }}
    >
      <CardContent>
        {props.title ? (
          <Typography
            gutterBottom
            sx={{ color: "text.secondary", fontSize: 14 }}
          >
            {props.title}
          </Typography>
        ) : (
          ""
        )}
        <Typography variant="h6" color="primary">
          {props.value}
        </Typography>
      </CardContent>
    </Card>
  );
}
