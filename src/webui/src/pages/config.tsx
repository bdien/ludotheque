import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
  Icon,
  InputAdornment,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { mutate } from "swr";
import { navigate } from "wouter/use-browser-location";
import { fetcher, SERVER_URL, updateConfig } from "../api/calls";
import { Loading } from "../components/loading";
import { useGlobalStore } from "../hooks/global_store";

interface PricingFields {
  regular: number;
  regular_summer: number;
  big: number;
  big_associations: number;
  card: number;
  card_value: number;
  yearly: number;
}

interface ConfigFormValues {
  loan_weeks: number;
  loan_weeks_summer: number;
  loan_maxitems: number;
  loan_extend_max: number;
  loan_extend_days: number;
  email_minperiod: number;
  email_minlate: number;
  email_sender: string;
  email_cc: string;
  item_new_days: number;
  summer_mode: boolean;
  planning_url: string;
  pricing: PricingFields;
}

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Paper sx={{ p: { xs: 2, sm: 2.5 }, overflow: "hidden" }} variant="outlined">
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Icon color="primary" sx={{ fontSize: 20 }}>
          {icon}
        </Icon>
        <Typography variant="subtitle1" fontWeight={600}>
          {title}
        </Typography>
      </Stack>
      {children}
    </Paper>
  );
}

export function Config() {
  const showSnackbar = useGlobalStore((state) => state.showSnackbar);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<ConfigFormValues | null>(null);
  const initialValues = useRef<ConfigFormValues | null>(null);

  useEffect(() => {
    fetcher(`${SERVER_URL}/config`).then((data: Record<string, unknown>) => {
      const parsed: ConfigFormValues = {
        loan_weeks: (data.loan_weeks as number) ?? 3,
        loan_weeks_summer: (data.loan_weeks_summer as number) ?? 8,
        loan_maxitems: (data.loan_maxitems as number) ?? 8,
        loan_extend_max: (data.loan_extend_max as number) ?? 1,
        loan_extend_days: (data.loan_extend_days as number) ?? 15,
        email_minperiod: (data.email_minperiod as number) ?? 21,
        email_minlate: (data.email_minlate as number) ?? 14,
        email_sender: (data.email_sender as string) ?? "",
        email_cc: (data.email_cc as string) ?? "",
        item_new_days: (data.item_new_days as number) ?? 60,
        summer_mode: (data.summer_mode as boolean) ?? false,
        planning_url: (data.planning_url as string) ?? "",
        pricing: {
          regular: (data.pricing as PricingFields)?.regular ?? 0,
          regular_summer: (data.pricing as PricingFields)?.regular_summer ?? 1,
          big: (data.pricing as PricingFields)?.big ?? 0,
          big_associations: (data.pricing as PricingFields)?.big_associations ?? 0,
          card: (data.pricing as PricingFields)?.card ?? 0,
          card_value: (data.pricing as PricingFields)?.card_value ?? 0,
          yearly: (data.pricing as PricingFields)?.yearly ?? 0,
        },
      };
      setValues(parsed);
      initialValues.current = parsed;
      setLoading(false);
    });
  }, []);

  if (loading || !values) return <Loading />;

  function update<K extends keyof ConfigFormValues>(key: K, value: ConfigFormValues[K]) {
    setValues((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function updatePricing<K extends keyof PricingFields>(key: K, value: number) {
    setValues((prev) => (prev ? { ...prev, pricing: { ...prev.pricing, [key]: value } } : prev));
  }

  async function onSubmit() {
    if (!values || !initialValues.current) return;
    setSaving(true);
    setError(null);
    try {
      const entries: Record<string, unknown> = {};
      const init = initialValues.current;

      for (const [k, v] of Object.entries(values)) {
        if (k === "pricing") {
          const pricingInit = init.pricing;
          const pricingCurr = values.pricing;
          const changed: Record<string, number> = {};
          for (const pk of Object.keys(pricingCurr) as (keyof PricingFields)[]) {
            if (pricingCurr[pk] !== pricingInit[pk]) changed[pk] = pricingCurr[pk];
          }
          if (Object.keys(changed).length > 0) entries.pricing = changed;
        } else if (v !== (init as unknown as Record<string, unknown>)[k]) {
          entries[k] = v;
        }
      }

      if (Object.keys(entries).length === 0) {
        showSnackbar("Aucune modification");
        navigate("/");
        return;
      }

      await updateConfig(entries);
      await mutate(`${SERVER_URL}/info`);
      showSnackbar("Configuration sauvegardée");
      navigate("/");
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1.5, sm: 2 } }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
        <Icon sx={{ fontSize: 28, color: "primary.main" }}>settings</Icon>
        <Typography variant="h6">Configuration</Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={2.5}>
        <SectionCard icon="swap_horiz" title="Emprunt">
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Switch
              checked={values.summer_mode}
              onChange={(e) => update("summer_mode", e.target.checked)}
              size="small"
            />
            <Typography variant="body2">Mode été</Typography>
          </Stack>
          <Grid container spacing={1.5}>
            <Grid size={6}>
              <TextField
                label="Durée"
                type="number"
                size="small"
                value={values.loan_weeks}
                onChange={(e) => update("loan_weeks", Number(e.target.value))}
                slotProps={{
                  input: { endAdornment: <InputAdornment position="end">semaines</InputAdornment> },
                }}
                fullWidth
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="Durée (été)"
                type="number"
                size="small"
                value={values.loan_weeks_summer}
                onChange={(e) => update("loan_weeks_summer", Number(e.target.value))}
                slotProps={{
                  input: { endAdornment: <InputAdornment position="end">semaines</InputAdornment> },
                }}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                label="Prolongation"
                type="number"
                size="small"
                value={values.loan_extend_max}
                onChange={(e) => update("loan_extend_max", Number(e.target.value))}
                slotProps={{
                  input: { endAdornment: <InputAdornment position="end">max</InputAdornment> },
                }}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                label="Durée prolongation"
                type="number"
                size="small"
                value={values.loan_extend_days}
                onChange={(e) => update("loan_extend_days", Number(e.target.value))}
                slotProps={{
                  input: { endAdornment: <InputAdornment position="end">jours</InputAdornment> },
                }}
                fullWidth
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="Limite par adhérent"
                type="number"
                size="small"
                value={values.loan_maxitems}
                onChange={(e) => update("loan_maxitems", Number(e.target.value))}
                slotProps={{
                  input: { endAdornment: <InputAdornment position="end">jeux</InputAdornment> },
                }}
                fullWidth
              />
            </Grid>
          </Grid>
        </SectionCard>

        <SectionCard icon="mail" title="Email">
          <Grid container spacing={1.5}>
            <Grid size={6}>
              <TextField
                label="Retard mini"
                type="number"
                size="small"
                value={values.email_minlate}
                onChange={(e) => update("email_minlate", Number(e.target.value))}
                slotProps={{
                  input: { endAdornment: <InputAdornment position="end">jours</InputAdornment> },
                }}
                fullWidth
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="Entre 2 emails"
                type="number"
                size="small"
                value={values.email_minperiod}
                onChange={(e) => update("email_minperiod", Number(e.target.value))}
                slotProps={{
                  input: { endAdornment: <InputAdornment position="end">jours</InputAdornment> },
                }}
                fullWidth
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Expéditeur"
                type="email"
                size="small"
                value={values.email_sender}
                onChange={(e) => update("email_sender", e.target.value)}
                placeholder="ludotheque@example.com"
                fullWidth
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Email en copie"
                type="email"
                size="small"
                value={values.email_cc}
                onChange={(e) => update("email_cc", e.target.value)}
                placeholder="copie@example.com"
                fullWidth
              />
            </Grid>
          </Grid>
        </SectionCard>

        <SectionCard icon="sports_esports" title="Jeux">
          <TextField
            label="Nouveauté"
            type="number"
            size="small"
            value={values.item_new_days}
            onChange={(e) => update("item_new_days", Number(e.target.value))}
            slotProps={{
              input: { endAdornment: <InputAdornment position="end">jours</InputAdornment> },
            }}
            helperText="Durée pendant laquelle un jeu est 'nouveau'"
            fullWidth
          />
        </SectionCard>

        <SectionCard icon="link" title="Général">
          <TextField
            label="Planning bénévoles"
            type="url"
            size="small"
            value={values.planning_url}
            onChange={(e) => update("planning_url", e.target.value)}
            placeholder="https://framadate.org/..."
            helperText="Lien Framadate ou autre (vide = masqué)"
            fullWidth
          />
        </SectionCard>

        <SectionCard icon="euro" title="Tarifs">
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 6, md: 4 }}>
              <TextField
                label="Normal"
                type="number"
                size="small"
                slotProps={{
                  htmlInput: { step: 0.1 },
                  input: { endAdornment: <InputAdornment position="end">€</InputAdornment> },
                }}
                value={values.pricing.regular}
                onChange={(e) => updatePricing("regular", Number(e.target.value))}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
              <TextField
                label="Normal été"
                type="number"
                size="small"
                slotProps={{
                  htmlInput: { step: 0.1 },
                  input: { endAdornment: <InputAdornment position="end">€</InputAdornment> },
                }}
                value={values.pricing.regular_summer}
                onChange={(e) => updatePricing("regular_summer", Number(e.target.value))}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
              <TextField
                label="Gros jeu"
                type="number"
                size="small"
                slotProps={{
                  htmlInput: { step: 0.1 },
                  input: { endAdornment: <InputAdornment position="end">€</InputAdornment> },
                }}
                value={values.pricing.big}
                onChange={(e) => updatePricing("big", Number(e.target.value))}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
              <TextField
                label="Gros jeu (assos)"
                type="number"
                size="small"
                slotProps={{
                  htmlInput: { step: 0.1 },
                  input: { endAdornment: <InputAdornment position="end">€</InputAdornment> },
                }}
                value={values.pricing.big_associations}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
              <TextField
                label="Prix de la Carte"
                type="number"
                size="small"
                slotProps={{
                  htmlInput: { step: 0.1 },
                  input: { endAdornment: <InputAdornment position="end">€</InputAdornment> },
                }}
                value={values.pricing.card}
                onChange={(e) => updatePricing("card", Number(e.target.value))}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
              <TextField
                label="Valeur de la carte"
                type="number"
                size="small"
                slotProps={{
                  htmlInput: { step: 0.1 },
                  input: { endAdornment: <InputAdornment position="end">€</InputAdornment> },
                }}
                value={values.pricing.card_value}
                onChange={(e) => updatePricing("card_value", Number(e.target.value))}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
              <TextField
                label="Adhésion annuelle"
                type="number"
                size="small"
                slotProps={{
                  htmlInput: { step: 0.1 },
                  input: { endAdornment: <InputAdornment position="end">€</InputAdornment> },
                }}
                value={values.pricing.yearly}
                onChange={(e) => updatePricing("yearly", Number(e.target.value))}
                fullWidth
              />
            </Grid>
          </Grid>
        </SectionCard>

        <Box sx={{ display: "flex", gap: 1.5, flexDirection: { xs: "column", sm: "row" } }}>
          <Button
            variant="contained"
            color="secondary"
            onClick={onSubmit}
            loading={saving}
            sx={{ flex: 1 }}
          >
            Sauvegarder
          </Button>
          <Button variant="outlined" onClick={() => navigate("/")} sx={{ flex: 1 }}>
            Annuler
          </Button>
        </Box>
      </Stack>
    </Container>
  );
}
