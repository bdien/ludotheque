import { useAuth0 } from "@auth0/auth0-react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Icon from "@mui/material/Icon";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { formatDistanceToNow, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useState } from "react";
import { updatePreferences } from "../api/calls";
import { usePreferences, useUser } from "../api/hooks";
import { Loading } from "../components/loading";
import { useGlobalStore } from "../hooks/global_store";

export function Account() {
  const { account, info } = useGlobalStore();
  const { isAuthenticated, loginWithRedirect, user: authUser } = useAuth0();
  const { user, isLoading, error } = useUser(account?.id || 0);
  const { preferences, mutate } = usePreferences();
  const showSnackbar = useGlobalStore((s) => s.showSnackbar);
  const [calInfoShown, setCalInfoShown] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [prefSaving, setPrefSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      loginWithRedirect();
    }
  }, [isAuthenticated, loginWithRedirect]);

  if (!isAuthenticated) return <Loading />;
  if (isLoading || !user) {
    if (error) return <div>Impossible de charger: {String(error)}</div>;
    return <Loading />;
  }

  const calendarUrl = user.calendar_token
    ? `${window.location.origin}/api/calendar/${user.calendar_token}.ics`
    : null;

  const copyCalendarUrl = () => {
    if (calendarUrl) {
      navigator.clipboard.writeText(calendarUrl);
      setCalInfoShown(true);
    }
  };

  const handlePrefToggle = async (key: "newsletter_optin" | "email_optin", val: boolean) => {
    setPrefSaving(key);
    try {
      const res = await updatePreferences({ [key]: val });
      window.umami?.track(`Account: ${key} ${val}`);
      // mutate SWR to new value
      mutate(res, false);
      showSnackbar("Préférence enregistrée", "success");
    } catch (e) {
      showSnackbar(`Erreur: ${String(e)}`, "error");
    } finally {
      setPrefSaving(null);
    }
  };

  const handleResetPassword = async () => {
    if (!authUser?.email && !user.emails?.[0]) {
      showSnackbar("Email introuvable", "error");
      return;
    }
    const email = authUser?.email || user.emails?.[0];
    setResetLoading(true);
    try {
      const res = await fetch(
        "https://dev-th8igg4x0hj35r1b.eu.auth0.com/dbconnections/change_password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: "wWKvUo1xxIozwbIrwSv4jB17xPsRTWD4",
            email,
            connection: "Username-Password-Authentication",
          }),
        },
      );
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Erreur ${res.status}`);
      }
      window.umami?.track("Account: reset_password");
      showSnackbar("Email envoyé ! Vérifiez votre boîte mail.", "success");
    } catch (e) {
      showSnackbar(`Erreur: ${String(e)}`, "error");
    } finally {
      setResetLoading(false);
    }
  };

  const subscriptionExpired = user.subscription ? isPast(new Date(user.subscription)) : false;
  const regularPrice = info.pricing.regular || 0.5;
  const nbJeux = Math.floor(user.credit / regularPrice);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h5" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Icon>account_circle</Icon> Mon profil
      </Typography>

      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {user.name}
        </Typography>
        {user.created_at && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <Icon fontSize="small">event</Icon>
            Compte ouvert le{" "}
            {new Date(user.created_at).toLocaleDateString("fr-FR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}{" "}
            ({formatDistanceToNow(new Date(user.created_at), { locale: fr, addSuffix: true })})
          </Typography>
        )}
        {user.subscription && (
          <Typography
            variant="body2"
            color={subscriptionExpired ? "error" : "text.secondary"}
            sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}
          >
            <Icon fontSize="small">card_membership</Icon>
            Abonnement jusqu&apos;au{" "}
            {new Date(user.subscription).toLocaleDateString("fr-FR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Typography>
        )}
        {user.credit > 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}
          >
            <Icon fontSize="small">savings</Icon> {user.credit}€ sur la carte, soit {nbJeux} jeu
            {nbJeux !== 1 ? "x" : ""}.
          </Typography>
        )}
      </Paper>

      <Paper elevation={2} sx={{ overflow: "hidden" }}>
        <Box
          sx={{
            bgcolor: "rgba(85,108,214,0.08)",
            borderBottom: 1,
            borderColor: "divider",
            px: 2,
            py: 1.2,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Icon fontSize="small" color="primary">
            contact_mail
          </Icon>
          <Typography variant="subtitle1" fontWeight={600} color="primary.dark">
            Coordonnées
          </Typography>
        </Box>
        <Box sx={{ p: 2 }}>
          {user.emails?.length ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              {user.emails.map((email: string) => (
                <Typography
                  key={email}
                  variant="body2"
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <Icon fontSize="small">mail</Icon> {email}
                </Typography>
              ))}
            </Box>
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <Icon fontSize="small">mail</Icon> Aucun email enregistré
            </Typography>
          )}
          {user.phones?.length && (
            <Typography
              variant="body2"
              sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}
            >
              <Icon fontSize="small">call</Icon> {user.phones.join(", ")}
            </Typography>
          )}
          {user.informations && (
            <Typography
              variant="body2"
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1,
                mt: 1,
                whiteSpace: "pre-wrap",
              }}
            >
              <Icon fontSize="small" sx={{ mt: "3px" }}>
                info
              </Icon>{" "}
              {user.informations}
            </Typography>
          )}
        </Box>
      </Paper>

      {calendarUrl && (
        <Paper elevation={2} sx={{ p: 2 }}>
          <Button
            variant="contained"
            color="info"
            startIcon={<Icon>calendar_today</Icon>}
            onClick={copyCalendarUrl}
          >
            Ajouter les emprunts à votre calendrier
          </Button>
          {calInfoShown && (
            <Alert
              severity="info"
              sx={{
                mt: 2,
                maxWidth: "100%",
                overflow: "hidden",
                "& .MuiAlert-message": { minWidth: 0, overflow: "hidden" },
              }}
            >
              Le lien a été copié dans votre presse-papier. Vous pouvez également coller ce lien
              dans votre application de calendrier (Google Calendar, Outlook...).
              <br />
              <Box
                component="a"
                href={calendarUrl}
                sx={{
                  display: "block",
                  maxWidth: "100%",
                  wordBreak: "break-all",
                  overflowWrap: "anywhere",
                }}
              >
                {calendarUrl}
              </Box>
            </Alert>
          )}
        </Paper>
      )}

      <Paper elevation={2} sx={{ overflow: "hidden" }}>
        <Box
          sx={{
            bgcolor: "rgba(85,108,214,0.08)",
            borderBottom: 1,
            borderColor: "divider",
            px: 2,
            py: 1.2,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Icon fontSize="small" color="primary">
            tune
          </Icon>
          <Typography variant="subtitle1" fontWeight={600} color="primary.dark">
            Préférences
          </Typography>
        </Box>
        <Box sx={{ p: 2 }}>
          {/* <FormControlLabel
            control={
              <Switch
                checked={preferences?.newsletter_optin ?? true}
                onChange={(_, v) => handlePrefToggle("newsletter_optin", v)}
                disabled={prefSaving === "newsletter_optin" || !preferences}
              />
            }
            label="Recevoir les infos de la ludo par email"
          />

          <Divider sx={{ my: 1.5 }} /> */}

          <Typography
            variant="subtitle2"
            sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}
          >
            <Icon fontSize="small">notifications</Icon> Notifications d'emprunts en retard
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              ml: 1,
              borderLeft: 2,
              borderColor: "divider",
              pl: 1,
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={preferences?.email_optin ?? true}
                  onChange={(_, v) => handlePrefToggle("email_optin", v)}
                  disabled={prefSaving === "email_optin" || !preferences}
                />
              }
              label="Par email"
            />
            <FormControlLabel
              control={<Checkbox checked={false} disabled />}
              label="Par notification (bientôt disponible)"
            />
          </Box>
        </Box>
      </Paper>

      <Paper elevation={2} sx={{ overflow: "hidden" }}>
        <Box
          sx={{
            bgcolor: "rgba(85,108,214,0.08)",
            borderBottom: 1,
            borderColor: "divider",
            px: 2,
            py: 1.2,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Icon fontSize="small" color="primary">
            security
          </Icon>
          <Typography variant="subtitle1" fontWeight={600} color="primary.dark">
            Sécurité
          </Typography>
        </Box>
        <Box sx={{ p: 2 }}>
          <Button
            variant="outlined"
            onClick={handleResetPassword}
            loading={resetLoading}
            startIcon={<Icon>lock_reset</Icon>}
          >
            Changer mon mot de passe
          </Button>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            Un email de réinitialisation sera envoyé à{" "}
            {authUser?.email || user.emails?.[0] || "votre adresse"}.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
