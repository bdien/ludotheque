import { Alert, Box, Button, Divider, Icon, TextField, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { mutate } from "swr";
import { navigate } from "wouter/use-browser-location";
import { fetcher, SERVER_URL, updateConfig } from "../api/calls";
import { useGlobalStore } from "../hooks/global_store";

interface PricingFields {
  regular: number;
  big: number;
  big_associations: number;
  card: number;
  card_value: number;
  yearly: number;
}

interface ConfigFormValues {
  loan_weeks: number;
  loan_maxitems: number;
  loan_extend_max: number;
  loan_extend_days: number;
  email_minperiod: number;
  email_minlate: number;
  email_sender: string;
  email_cc: string;
  item_new_days: number;
  pricing: PricingFields;
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
        loan_maxitems: (data.loan_maxitems as number) ?? 8,
        loan_extend_max: (data.loan_extend_max as number) ?? 1,
        loan_extend_days: (data.loan_extend_days as number) ?? 15,
        email_minperiod: (data.email_minperiod as number) ?? 21,
        email_minlate: (data.email_minlate as number) ?? 14,
        email_sender: (data.email_sender as string) ?? "",
        email_cc: (data.email_cc as string) ?? "",
        item_new_days: (data.item_new_days as number) ?? 60,
        pricing: {
          regular: (data.pricing as PricingFields)?.regular ?? 0,
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

  if (loading || !values) return "Chargement...";

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
          if (JSON.stringify(pricingInit) !== JSON.stringify(pricingCurr)) {
            entries.pricing = pricingCurr;
          }
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

  function section(title: string) {
    return (
      <>
        <Divider sx={{ my: 3 }} />
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
      </>
    );
  }

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h5" gutterBottom>
        <Icon sx={{ verticalAlign: "middle", mr: 1 }}>settings</Icon>
        Configuration
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {section("Emprunt")}
      <TextField
        label="Durée d'emprunt (semaines)"
        type="number"
        value={values.loan_weeks}
        onChange={(e) => update("loan_weeks", Number(e.target.value))}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Nombre max d'objets emprunté par un adhérent"
        type="number"
        value={values.loan_maxitems}
        onChange={(e) => update("loan_maxitems", Number(e.target.value))}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Nombre de prolongations maximum"
        type="number"
        value={values.loan_extend_max}
        onChange={(e) => update("loan_extend_max", Number(e.target.value))}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Jours de prolongation"
        type="number"
        value={values.loan_extend_days}
        onChange={(e) => update("loan_extend_days", Number(e.target.value))}
        fullWidth
        margin="normal"
      />

      {section("Email")}
      <TextField
        label="Période minimum entre emails (jours)"
        type="number"
        value={values.email_minperiod}
        onChange={(e) => update("email_minperiod", Number(e.target.value))}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Retard minimum avant email (jours)"
        type="number"
        value={values.email_minlate}
        onChange={(e) => update("email_minlate", Number(e.target.value))}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Email expediteur"
        value={values.email_sender}
        onChange={(e) => update("email_sender", e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Email en copie"
        value={values.email_cc}
        onChange={(e) => update("email_cc", e.target.value)}
        fullWidth
        margin="normal"
      />

      {section("Jeux")}
      <TextField
        label="Age (en jours) où un jeu est considéré comme nouveau"
        type="number"
        value={values.item_new_days}
        onChange={(e) => update("item_new_days", Number(e.target.value))}
        fullWidth
        margin="normal"
      />

      {section("Tarifs")}
      <TextField
        label="Tarif d'un jeu normal (€)"
        type="number"
        slotProps={{ htmlInput: { step: 0.1 } }}
        value={values.pricing.regular}
        onChange={(e) => updatePricing("regular", Number(e.target.value))}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Tarif gros jeu (€)"
        type="number"
        slotProps={{ htmlInput: { step: 0.1 } }}
        value={values.pricing.big}
        onChange={(e) => updatePricing("big", Number(e.target.value))}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Tarif gros jeu (€, pour les assos)"
        type="number"
        slotProps={{ htmlInput: { step: 0.1 } }}
        value={values.pricing.big_associations}
        onChange={(e) => updatePricing("big_associations", Number(e.target.value))}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Tarif d'une carte (€)"
        type="number"
        slotProps={{ htmlInput: { step: 0.1 } }}
        value={values.pricing.card}
        onChange={(e) => updatePricing("card", Number(e.target.value))}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Valeur carte (€)"
        type="number"
        slotProps={{ htmlInput: { step: 0.1 } }}
        value={values.pricing.card_value}
        onChange={(e) => updatePricing("card_value", Number(e.target.value))}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Adhésion annuelle (€)"
        type="number"
        slotProps={{ htmlInput: { step: 0.1 } }}
        value={values.pricing.yearly}
        onChange={(e) => updatePricing("yearly", Number(e.target.value))}
        fullWidth
        margin="normal"
      />

      <Divider sx={{ my: 3 }} />
      <Button variant="contained" fullWidth color="secondary" onClick={onSubmit} loading={saving}>
        Sauvegarder
      </Button>
      <Button variant="outlined" fullWidth sx={{ mt: 1 }} onClick={() => navigate("/")}>
        Annuler
      </Button>
    </Box>
  );
}
