import Box from "@mui/material/Box";
import { emailUser } from "../api/calls";
import { useEffect, useState } from "react";
import { EMail } from "../api/models";
import { Loading } from "../components/loading";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Alert,
} from "@mui/material";
import { ShortUser } from "../components/short_user";

interface LateEmailProps {
  id: number;
}

export function LateEmail(props: LateEmailProps) {
  const [email, setEmail] = useState<EMail>();
  const [error, setError] = useState<string>("");

  useEffect(() => {
    emailUser(props.id, false).then((i) => setEmail(i));
  }, []);

  if (!email) return <Loading />;

  return (
    <Box>
      <Box sx={{ p: 2 }}>
        Le courriel suivant va être envoyé à "
        <ShortUser user_id={props.id} />"
      </Box>

      {error ? (
        <Alert severity="error" sx={{ my: 2, border: "1px solid #00000020" }}>
          {error}
        </Alert>
      ) : (
        ""
      )}

      <Card>
        <CardHeader title={email.title} subheader={`Pour: ${email.to}`} />
        <CardContent>
          <Typography
            variant="body2"
            color="text.secondary"
            dangerouslySetInnerHTML={{
              __html: email.body,
            }}
          ></Typography>
        </CardContent>
      </Card>

      <Button
        variant="contained"
        fullWidth
        size="large"
        sx={{ mt: "20px", p: 1.5 }}
        onClick={() => {
          emailUser(props.id, true).then((data) => {
            if (data["sent"]) history.back();
            else if (data["error"]) setError(data["error"]);
          });
        }}
      >
        Envoyer
      </Button>

      <Button
        variant="outlined"
        fullWidth
        size="large"
        sx={{ mt: "15px" }}
        onClick={() => history.back()}
      >
        Annuler
      </Button>
    </Box>
  );
}
