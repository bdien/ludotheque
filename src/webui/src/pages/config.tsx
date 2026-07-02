import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
  Icon,
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
    <Paper sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2.5 }}>
        <Icon color="primary">{icon}</Icon>
        <Typography variant="h6">{title}</Typography>
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
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <Icon sx={{ fontSize: 32, color: "primary.main" }}>settings</Icon>
        <Typography variant="h5">Configuration</Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={3}>
        <SectionCard icon="swap_horiz" title="Emprunt">
          <Stack direction="row" spacing={4} sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Switch
                checked={values.summer_mode}
                onChange={(e) => update("summer_mode", e.target.checked)}
              />
              <Typography>Mode été</Typography>
            </Stack>
          </Stack>
          <Grid container spacing={2}>
            <Grid size={6}>
              <TextField
                label="Durée d'emprunt (semaines)"
                type="number"
                value={values.loan_weeks}
                onChange={(e) => update("loan_weeks", Number(e.target.value))}
                fullWidth
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="Durée d'emprunt été (semaines)"
                type="number"
                value={values.loan_weeks_summer}
                onChange={(e) => update("loan_weeks_summer", Number(e.target.value))}
                fullWidth
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="Max d'objets par adhérent"
                type="number"
                value={values.loan_maxitems}
                onChange={(e) => update("loan_maxitems", Number(e.target.value))}
                fullWidth
              />
            </Grid>
            <Grid size={3}>
              <TextField
                label="Prolongations max"
                type="number"
                value={values.loan_extend_max}
                onChange={(e) => update("loan_extend_max", Number(e.target.value))}
                fullWidth
              />
            </Grid>
            <Grid size={3}>
              <TextField
                label="Jours de prolongation"
                type="number"
                value={values.loan_extend_days}
                onChange={(e) => update("loan_extend_days", Number(e.target.value))}
                fullWidth
              />
            </Grid>
          </Grid>
        </SectionCard>

        <SectionCard icon="mail" title="Email">
          <Grid container spacing={2}>
            <Grid size={6}>
              <TextField
                label="Période min entre emails (jours)"
                type="number"
                value={values.email_minperiod}
                onChange={(e) => update("email_minperiod", Number(e.target.value))}
                fullWidth
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="Retard min avant email (jours)"
                type="number"
                value={values.email_minlate}
                onChange={(e) => update("email_minlate", Number(e.target.value))}
                fullWidth
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="Email expéditeur"
                value={values.email_sender}
                onChange={(e) => update("email_sender", e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="Email en copie"
                value={values.email_cc}
                onChange={(e) => update("email_cc", e.target.value)}
                fullWidth
              />
            </Grid>
          </Grid>
        </SectionCard>

        <SectionCard icon="sports_esports" title="Jeux">
          <TextField
            label="Âge (en jours) où un jeu est considéré comme nouveau"
            type="number"
            value={values.item_new_days}
            onChange={(e) => update("item_new_days", Number(e.target.value))}
            fullWidth
          />
        </SectionCard>

        <SectionCard icon="euro" title="Tarifs">
          <Grid container spacing={2}>
            <Grid size={4}>
              <TextField
                label="Jeu normal (€)"
                type="number"
                slotProps={{ htmlInput: { step: 0.1 } }}
                value={values.pricing.regular}
                onChange={(e) => updatePricing("regular", Number(e.target.value))}
                fullWidth
              />
            </Grid>
            <Grid size={4}>
              <TextField
                label="Jeu normal été (€)"
                type="number"
                slotProps={{ htmlInput: { step: 0.1 } }}
                value={values.pricing.regular_summer}
                onChange={(e) => updatePricing("regular_summer", Number(e.target.value))}
                fullWidth
              />
            </Grid>
            <Grid size={4}>
              <TextField
                label="Gros jeu (€)"
                type="number"
                slotProps={{ htmlInput: { step: 0.1 } }}
                value={values.pricing.big}
                onChange={(e) => updatePricing("big", Number(e.target.value))}
                fullWidth
              />
            </Grid>
            <Grid size={4}>
              <TextField
                label="Gros jeu assos (€)"
                type="number"
                slotProps={{ htmlInput: { step: 0.1 } }}
                value={values.pricing.big_associations}
                onChange={(e) => updatePricing("big_associations", Number(e.target.value))}
                fullWidth
              />
            </Grid>
            <Grid size={4}>
              <TextField
                label="Carte (€)"
                type="number"
                slotProps={{ htmlInput: { step: 0.1 } }}
                value={values.pricing.card}
                onChange={(e) => updatePricing("card", Number(e.target.value))}
                fullWidth
              />
            </Grid>
            <Grid size={4}>
              <TextField
                label="Valeur carte (€)"
                type="number"
                slotProps={{ htmlInput: { step: 0.1 } }}
                value={values.pricing.card_value}
                onChange={(e) => updatePricing("card_value", Number(e.target.value))}
                fullWidth
              />
            </Grid>
            <Grid size={4}>
              <TextField
                label="Adhésion annuelle (€)"
                type="number"
                slotProps={{ htmlInput: { step: 0.1 } }}
                value={values.pricing.yearly}
                onChange={(e) => updatePricing("yearly", Number(e.target.value))}
                fullWidth
              />
            </Grid>
          </Grid>
        </SectionCard>

        <Box sx={{ display: "flex", gap: 2 }}>
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
