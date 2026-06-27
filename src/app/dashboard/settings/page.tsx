"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import DashboardSidebar from "../../components/DashboardSidebar";
import { supabase } from "../../lib/supabaseClient";

type Business = {
  id: string;
  name: string;
  slug: string;
  plan_status: string | null;
  trial_days_left: number | null;
  team_login_limit: number | null;
};

type Settings = {
  id?: string;
  business_id: string;

  default_booking_flow: string;
  allow_staff_choice: boolean;
  allow_any_available: boolean;

  allow_customer_cancel: boolean;
  cancellation_deadline: string;
  cancellation_policy_text: string;

  allow_customer_reschedule: boolean;
  require_reschedule_approval: boolean;
  reschedule_deadline: string;
  reschedule_policy_text: string;

  default_payment_behavior: string;
  allow_cash_deposits: boolean;
  allow_custom_payment_links: boolean;
  allow_appointeaze_payments: boolean;
  show_deposit_refund_policy: boolean;

  dashboard_alerts: boolean;
  email_alerts: boolean;
  new_booking_alerts: boolean;
  cancellation_alerts: boolean;
  reschedule_alerts: boolean;
  customer_account_alerts: boolean;
  payment_received_alerts: boolean;
  deposit_received_alerts: boolean;
  deposit_due_alerts: boolean;
  deposit_overdue_alerts: boolean;
  manual_payment_alerts: boolean;
  daily_email_summary: boolean;
  notify_assigned_team_member: boolean;
  notification_email: string;
  backup_notification_email: string;
  email_alert_frequency: string;

  email_confirmations: boolean;
  email_reminders: boolean;
  one_click_text_reminder: boolean;
  copy_reminder_message: boolean;
  first_reminder_time: string;
  second_reminder_time: string;

  allow_guest_booking: boolean;
  offer_customer_account: boolean;
  customer_booking_history: boolean;
  customer_self_cancel: boolean;
  customer_self_reschedule: boolean;
  customer_upcoming_appointments: boolean;
};

function blankSettings(businessId: string): Settings {
  return {
    business_id: businessId,

    default_booking_flow: "simple",
    allow_staff_choice: true,
    allow_any_available: true,

    allow_customer_cancel: true,
    cancellation_deadline: "24 hours before",
    cancellation_policy_text:
      "Please cancel at least 24 hours before your appointment.",

    allow_customer_reschedule: true,
    require_reschedule_approval: false,
    reschedule_deadline: "24 hours before",
    reschedule_policy_text:
      "Reschedules within 24 hours may require business approval.",

    default_payment_behavior: "No payment required by default",
    allow_cash_deposits: true,
    allow_custom_payment_links: true,
    allow_appointeaze_payments: true,
    show_deposit_refund_policy: true,

    dashboard_alerts: true,
    email_alerts: true,
    new_booking_alerts: true,
    cancellation_alerts: true,
    reschedule_alerts: true,
    customer_account_alerts: false,
    payment_received_alerts: true,
    deposit_received_alerts: true,
    deposit_due_alerts: true,
    deposit_overdue_alerts: true,
    manual_payment_alerts: true,
    daily_email_summary: false,
    notify_assigned_team_member: true,
    notification_email: "",
    backup_notification_email: "",
    email_alert_frequency: "Send immediately",

    email_confirmations: true,
    email_reminders: true,
    one_click_text_reminder: true,
    copy_reminder_message: true,
    first_reminder_time: "24 hours before",
    second_reminder_time: "None",

    allow_guest_booking: true,
    offer_customer_account: true,
    customer_booking_history: true,
    customer_self_cancel: true,
    customer_self_reschedule: true,
    customer_upcoming_appointments: true,
  };
}

export default function SettingsPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);

    const { data: businessData, error: businessError } = await supabase
      .from("businesses")
      .select("id, name, slug, plan_status, trial_days_left, team_login_limit")
      .eq("slug", "elite-barber-studio")
      .maybeSingle();

    if (businessError || !businessData) {
      console.error("Business load error:", businessError);
      setBusiness(null);
      setSettings(null);
      setLoading(false);
      return;
    }

    setBusiness(businessData as Business);

    const fallback = blankSettings(businessData.id);

    const { data: settingsData, error: settingsError } = await supabase
      .from("business_settings")
      .select("*")
      .eq("business_id", businessData.id)
      .maybeSingle();

    if (settingsError) {
      console.error("Settings load error:", settingsError);
    }

    if (!settingsData) {
      setSettings(fallback);
      setLoading(false);
      return;
    }

    setSettings({
      id: settingsData.id,
      business_id: settingsData.business_id,

      default_booking_flow:
        settingsData.default_booking_flow || fallback.default_booking_flow,
      allow_staff_choice:
        settingsData.allow_staff_choice ?? fallback.allow_staff_choice,
      allow_any_available:
        settingsData.allow_any_available ?? fallback.allow_any_available,

      allow_customer_cancel:
        settingsData.allow_customer_cancel ?? fallback.allow_customer_cancel,
      cancellation_deadline:
        settingsData.cancellation_deadline || fallback.cancellation_deadline,
      cancellation_policy_text:
        settingsData.cancellation_policy_text ||
        fallback.cancellation_policy_text,

      allow_customer_reschedule:
        settingsData.allow_customer_reschedule ??
        fallback.allow_customer_reschedule,
      require_reschedule_approval:
        settingsData.require_reschedule_approval ??
        fallback.require_reschedule_approval,
      reschedule_deadline:
        settingsData.reschedule_deadline || fallback.reschedule_deadline,
      reschedule_policy_text:
        settingsData.reschedule_policy_text || fallback.reschedule_policy_text,

      default_payment_behavior:
        settingsData.default_payment_behavior ||
        fallback.default_payment_behavior,
      allow_cash_deposits:
        settingsData.allow_cash_deposits ?? fallback.allow_cash_deposits,
      allow_custom_payment_links:
        settingsData.allow_custom_payment_links ??
        fallback.allow_custom_payment_links,
      allow_appointeaze_payments:
        settingsData.allow_appointeaze_payments ??
        fallback.allow_appointeaze_payments,
      show_deposit_refund_policy:
        settingsData.show_deposit_refund_policy ??
        fallback.show_deposit_refund_policy,

      dashboard_alerts:
        settingsData.dashboard_alerts ?? fallback.dashboard_alerts,
      email_alerts: settingsData.email_alerts ?? fallback.email_alerts,
      new_booking_alerts:
        settingsData.new_booking_alerts ?? fallback.new_booking_alerts,
      cancellation_alerts:
        settingsData.cancellation_alerts ?? fallback.cancellation_alerts,
      reschedule_alerts:
        settingsData.reschedule_alerts ?? fallback.reschedule_alerts,
      customer_account_alerts:
        settingsData.customer_account_alerts ??
        fallback.customer_account_alerts,
      payment_received_alerts:
        settingsData.payment_received_alerts ??
        fallback.payment_received_alerts,
      deposit_received_alerts:
        settingsData.deposit_received_alerts ??
        fallback.deposit_received_alerts,
      deposit_due_alerts:
        settingsData.deposit_due_alerts ?? fallback.deposit_due_alerts,
      deposit_overdue_alerts:
        settingsData.deposit_overdue_alerts ??
        fallback.deposit_overdue_alerts,
      manual_payment_alerts:
        settingsData.manual_payment_alerts ?? fallback.manual_payment_alerts,
      daily_email_summary:
        settingsData.daily_email_summary ?? fallback.daily_email_summary,
      notify_assigned_team_member:
        settingsData.notify_assigned_team_member ??
        fallback.notify_assigned_team_member,
      notification_email:
        settingsData.notification_email || fallback.notification_email,
      backup_notification_email:
        settingsData.backup_notification_email ||
        fallback.backup_notification_email,
      email_alert_frequency:
        settingsData.email_alert_frequency || fallback.email_alert_frequency,

      email_confirmations:
        settingsData.email_confirmations ?? fallback.email_confirmations,
      email_reminders: settingsData.email_reminders ?? fallback.email_reminders,
      one_click_text_reminder:
        settingsData.one_click_text_reminder ??
        fallback.one_click_text_reminder,
      copy_reminder_message:
        settingsData.copy_reminder_message ?? fallback.copy_reminder_message,
      first_reminder_time:
        settingsData.first_reminder_time || fallback.first_reminder_time,
      second_reminder_time:
        settingsData.second_reminder_time || fallback.second_reminder_time,

      allow_guest_booking:
        settingsData.allow_guest_booking ?? fallback.allow_guest_booking,
      offer_customer_account:
        settingsData.offer_customer_account ?? fallback.offer_customer_account,
      customer_booking_history:
        settingsData.customer_booking_history ??
        fallback.customer_booking_history,
      customer_self_cancel:
        settingsData.customer_self_cancel ?? fallback.customer_self_cancel,
      customer_self_reschedule:
        settingsData.customer_self_reschedule ??
        fallback.customer_self_reschedule,
      customer_upcoming_appointments:
        settingsData.customer_upcoming_appointments ??
        fallback.customer_upcoming_appointments,
    });

    setLoading(false);
  }

  function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((current) => {
      if (!current) return current;

      return {
        ...current,
        [key]: value,
      };
    });
  }

  function buildCorePayload(currentSettings: Settings) {
    return {
      business_id: currentSettings.business_id,
      default_booking_flow: currentSettings.default_booking_flow,
      allow_staff_choice: currentSettings.allow_staff_choice,
      allow_any_available: currentSettings.allow_any_available,
      allow_guest_booking: currentSettings.allow_guest_booking,
      offer_customer_account: currentSettings.offer_customer_account,
      allow_customer_cancel: currentSettings.allow_customer_cancel,
      cancellation_deadline: currentSettings.cancellation_deadline,
      allow_customer_reschedule: currentSettings.allow_customer_reschedule,
      require_reschedule_approval: currentSettings.require_reschedule_approval,
      reschedule_deadline: currentSettings.reschedule_deadline,
      email_confirmations: currentSettings.email_confirmations,
      email_reminders: currentSettings.email_reminders,
      dashboard_alerts: currentSettings.dashboard_alerts,
      email_alerts: currentSettings.email_alerts,
      notification_email: currentSettings.notification_email || null,
    };
  }

  function buildFullPayload(currentSettings: Settings) {
    return {
      ...buildCorePayload(currentSettings),

      cancellation_policy_text:
        currentSettings.cancellation_policy_text || null,
      reschedule_policy_text: currentSettings.reschedule_policy_text || null,

      default_payment_behavior: currentSettings.default_payment_behavior,
      allow_cash_deposits: currentSettings.allow_cash_deposits,
      allow_custom_payment_links: currentSettings.allow_custom_payment_links,
      allow_appointeaze_payments: currentSettings.allow_appointeaze_payments,
      show_deposit_refund_policy: currentSettings.show_deposit_refund_policy,

      new_booking_alerts: currentSettings.new_booking_alerts,
      cancellation_alerts: currentSettings.cancellation_alerts,
      reschedule_alerts: currentSettings.reschedule_alerts,
      customer_account_alerts: currentSettings.customer_account_alerts,
      payment_received_alerts: currentSettings.payment_received_alerts,
      deposit_received_alerts: currentSettings.deposit_received_alerts,
      deposit_due_alerts: currentSettings.deposit_due_alerts,
      deposit_overdue_alerts: currentSettings.deposit_overdue_alerts,
      manual_payment_alerts: currentSettings.manual_payment_alerts,
      daily_email_summary: currentSettings.daily_email_summary,
      notify_assigned_team_member: currentSettings.notify_assigned_team_member,
      backup_notification_email:
        currentSettings.backup_notification_email || null,
      email_alert_frequency: currentSettings.email_alert_frequency,

      one_click_text_reminder: currentSettings.one_click_text_reminder,
      copy_reminder_message: currentSettings.copy_reminder_message,
      first_reminder_time: currentSettings.first_reminder_time,
      second_reminder_time: currentSettings.second_reminder_time,

      customer_booking_history: currentSettings.customer_booking_history,
      customer_self_cancel: currentSettings.customer_self_cancel,
      customer_self_reschedule: currentSettings.customer_self_reschedule,
      customer_upcoming_appointments:
        currentSettings.customer_upcoming_appointments,
    };
  }

  async function saveSettings() {
    if (!business || !settings) {
      alert("Settings are not loaded yet.");
      return;
    }

    setSaving(true);

    const fullPayload = buildFullPayload(settings);
    const corePayload = buildCorePayload(settings);

    if (settings.id) {
      const { error: fullError } = await supabase
        .from("business_settings")
        .update(fullPayload)
        .eq("id", settings.id);

      if (fullError) {
        console.warn("Full settings save failed. Retrying core save.", fullError);

        const { error: coreError } = await supabase
          .from("business_settings")
          .update(corePayload)
          .eq("id", settings.id);

        if (coreError) {
          console.error("Settings save error:", coreError);
          alert("Could not save settings.");
          setSaving(false);
          return;
        }
      }
    } else {
      const { data, error: fullError } = await supabase
        .from("business_settings")
        .insert(fullPayload)
        .select("*")
        .single();

      if (fullError || !data) {
        console.warn("Full settings create failed. Retrying core create.", fullError);

        const { data: coreData, error: coreError } = await supabase
          .from("business_settings")
          .insert(corePayload)
          .select("*")
          .single();

        if (coreError || !coreData) {
          console.error("Settings create error:", coreError);
          alert("Could not create settings.");
          setSaving(false);
          return;
        }

        setSettings({
          ...settings,
          id: coreData.id,
        });
      } else {
        setSettings({
          ...settings,
          id: data.id,
        });
      }
    }

    setSaving(false);
    alert("Settings saved.");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="flex">
          <DashboardSidebar active="Settings" />

          <section className="flex-1 p-6 lg:p-10">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-zinc-400">Loading settings from Supabase...</p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (!business || !settings) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="flex">
          <DashboardSidebar active="Settings" />

          <section className="flex-1 p-6 lg:p-10">
            <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-6">
              <h1 className="text-3xl font-black text-red-200">
                Settings not loaded
              </h1>
              <p className="mt-2 text-sm text-zinc-300">
                The app could not find Elite Barber Studio or its settings in
                Supabase.
              </p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="flex">
        <DashboardSidebar active="Settings" />

        <section className="flex-1 p-6 lg:p-10">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm text-purple-300">Dashboard / Settings</p>
              <h2 className="text-4xl font-black">Settings</h2>
              <p className="mt-2 max-w-3xl text-zinc-400">
                Set your business-wide defaults for booking rules, cancellations,
                reschedules, customer accounts, reminders, alerts, team options,
                and plan access. Individual services can override these settings
                when needed.
              </p>
            </div>

            <button
              onClick={saveSettings}
              disabled={saving}
              className="rounded-full bg-purple-500 px-6 py-3 font-bold hover:bg-purple-400 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <Card title="Default Booking Rules">
                <p className="mb-4 text-sm text-zinc-400">
                  These are the default rules for your booking page. Services can
                  override these settings if they need different rules.
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  <SettingBox title="Default booking flow">
                    <Radio
                      name="booking-flow"
                      label="Simple booking: service → time"
                      checked={settings.default_booking_flow === "simple"}
                      onChange={() =>
                        updateSetting("default_booking_flow", "simple")
                      }
                    />
                    <Radio
                      name="booking-flow"
                      label="Team booking: service → team → time"
                      checked={settings.default_booking_flow === "team"}
                      onChange={() =>
                        updateSetting("default_booking_flow", "team")
                      }
                    />
                  </SettingBox>

                  <SettingBox title="Team member selection">
                    <Checkbox
                      label="Allow customers to choose staff"
                      checked={settings.allow_staff_choice}
                      onChange={(checked) =>
                        updateSetting("allow_staff_choice", checked)
                      }
                    />
                    <Checkbox
                      label="Allow Any Available option"
                      checked={settings.allow_any_available}
                      onChange={(checked) =>
                        updateSetting("allow_any_available", checked)
                      }
                    />
                    <Checkbox
                      label="Allow guest booking without an account"
                      checked={settings.allow_guest_booking}
                      onChange={(checked) =>
                        updateSetting("allow_guest_booking", checked)
                      }
                    />
                  </SettingBox>
                </div>
              </Card>

              <Card title="Cancellation Policy">
                <p className="mb-4 text-sm text-zinc-400">
                  Businesses can set default cancellation rules. Services like
                  tattoos, consultations, or large jobs can have stricter rules
                  later.
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  <SettingBox title="Customer cancellations">
                    <Checkbox
                      label="Allow customers to cancel"
                      checked={settings.allow_customer_cancel}
                      onChange={(checked) =>
                        updateSetting("allow_customer_cancel", checked)
                      }
                    />
                    <Select
                      label="Cancellation deadline"
                      value={settings.cancellation_deadline}
                      options={[
                        "2 hours before",
                        "24 hours before",
                        "48 hours before",
                        "7 days before",
                        "No customer cancellations",
                        "Custom",
                      ]}
                      onChange={(value) =>
                        updateSetting("cancellation_deadline", value)
                      }
                    />
                  </SettingBox>

                  <SettingBox title="Cancellation notes">
                    <textarea
                      value={settings.cancellation_policy_text}
                      onChange={(event) =>
                        updateSetting(
                          "cancellation_policy_text",
                          event.target.value
                        )
                      }
                      placeholder="Example: Please cancel at least 24 hours before your appointment."
                      className="h-32 w-full resize-none rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm outline-none placeholder:text-zinc-600"
                    />
                  </SettingBox>
                </div>
              </Card>

              <Card title="Reschedule Policy">
                <p className="mb-4 text-sm text-zinc-400">
                  Set default reschedule rules for customers. Individual services
                  can require approval or stricter deadlines.
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  <SettingBox title="Customer reschedules">
                    <Checkbox
                      label="Allow customers to reschedule"
                      checked={settings.allow_customer_reschedule}
                      onChange={(checked) =>
                        updateSetting("allow_customer_reschedule", checked)
                      }
                    />
                    <Checkbox
                      label="Require business approval"
                      checked={settings.require_reschedule_approval}
                      onChange={(checked) =>
                        updateSetting("require_reschedule_approval", checked)
                      }
                    />
                    <Select
                      label="Reschedule deadline"
                      value={settings.reschedule_deadline}
                      options={[
                        "2 hours before",
                        "24 hours before",
                        "48 hours before",
                        "7 days before",
                        "No customer reschedules",
                        "Custom",
                      ]}
                      onChange={(value) =>
                        updateSetting("reschedule_deadline", value)
                      }
                    />
                  </SettingBox>

                  <SettingBox title="Reschedule notes">
                    <textarea
                      value={settings.reschedule_policy_text}
                      onChange={(event) =>
                        updateSetting(
                          "reschedule_policy_text",
                          event.target.value
                        )
                      }
                      placeholder="Example: Reschedules within 24 hours may require approval."
                      className="h-32 w-full resize-none rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm outline-none placeholder:text-zinc-600"
                    />
                  </SettingBox>
                </div>
              </Card>

              <Card title="Deposit & Payment Defaults">
                <p className="mb-4 text-sm text-zinc-400">
                  These are general defaults. Actual deposit/payment requirements
                  are set per service inside the Services page.
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  <SettingBox title="Default payment behavior">
                    <Radio
                      name="default-payment"
                      label="No payment required by default"
                      checked={
                        settings.default_payment_behavior ===
                        "No payment required by default"
                      }
                      onChange={() =>
                        updateSetting(
                          "default_payment_behavior",
                          "No payment required by default"
                        )
                      }
                    />
                    <Radio
                      name="default-payment"
                      label="Pay in person by default"
                      checked={
                        settings.default_payment_behavior ===
                        "Pay in person by default"
                      }
                      onChange={() =>
                        updateSetting(
                          "default_payment_behavior",
                          "Pay in person by default"
                        )
                      }
                    />
                    <Radio
                      name="default-payment"
                      label="Deposit required by default"
                      checked={
                        settings.default_payment_behavior ===
                        "Deposit required by default"
                      }
                      onChange={() =>
                        updateSetting(
                          "default_payment_behavior",
                          "Deposit required by default"
                        )
                      }
                    />
                    <Radio
                      name="default-payment"
                      label="Full payment required by default"
                      checked={
                        settings.default_payment_behavior ===
                        "Full payment required by default"
                      }
                      onChange={() =>
                        updateSetting(
                          "default_payment_behavior",
                          "Full payment required by default"
                        )
                      }
                    />
                  </SettingBox>

                  <SettingBox title="Deposit handling">
                    <Checkbox
                      label="Allow cash deposits"
                      checked={settings.allow_cash_deposits}
                      onChange={(checked) =>
                        updateSetting("allow_cash_deposits", checked)
                      }
                    />
                    <Checkbox
                      label="Allow custom payment links"
                      checked={settings.allow_custom_payment_links}
                      onChange={(checked) =>
                        updateSetting("allow_custom_payment_links", checked)
                      }
                    />
                    <Checkbox
                      label="Allow AppointEaze Payments"
                      checked={settings.allow_appointeaze_payments}
                      onChange={(checked) =>
                        updateSetting("allow_appointeaze_payments", checked)
                      }
                    />
                    <Checkbox
                      label="Show deposit/refund policy to customers"
                      checked={settings.show_deposit_refund_policy}
                      onChange={(checked) =>
                        updateSetting("show_deposit_refund_policy", checked)
                      }
                    />
                  </SettingBox>
                </div>
              </Card>

              <Card title="Alerts & Notifications">
                <p className="mb-4 text-sm text-zinc-400">
                  Choose when the business should be notified. For launch, these
                  alerts can appear inside the dashboard and also be sent by
                  email.
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  <SettingBox title="Booking alerts">
                    <Checkbox
                      label="New appointment booked"
                      checked={settings.new_booking_alerts}
                      onChange={(checked) =>
                        updateSetting("new_booking_alerts", checked)
                      }
                    />
                    <Checkbox
                      label="Appointment cancelled"
                      checked={settings.cancellation_alerts}
                      onChange={(checked) =>
                        updateSetting("cancellation_alerts", checked)
                      }
                    />
                    <Checkbox
                      label="Appointment rescheduled"
                      checked={settings.reschedule_alerts}
                      onChange={(checked) =>
                        updateSetting("reschedule_alerts", checked)
                      }
                    />
                    <Checkbox
                      label="Customer account created"
                      checked={settings.customer_account_alerts}
                      onChange={(checked) =>
                        updateSetting("customer_account_alerts", checked)
                      }
                    />
                  </SettingBox>

                  <SettingBox title="Payment alerts">
                    <Checkbox
                      label="Payment received"
                      checked={settings.payment_received_alerts}
                      onChange={(checked) =>
                        updateSetting("payment_received_alerts", checked)
                      }
                    />
                    <Checkbox
                      label="Deposit received"
                      checked={settings.deposit_received_alerts}
                      onChange={(checked) =>
                        updateSetting("deposit_received_alerts", checked)
                      }
                    />
                    <Checkbox
                      label="Deposit due soon"
                      checked={settings.deposit_due_alerts}
                      onChange={(checked) =>
                        updateSetting("deposit_due_alerts", checked)
                      }
                    />
                    <Checkbox
                      label="Deposit overdue"
                      checked={settings.deposit_overdue_alerts}
                      onChange={(checked) =>
                        updateSetting("deposit_overdue_alerts", checked)
                      }
                    />
                    <Checkbox
                      label="Manual payment marked paid"
                      checked={settings.manual_payment_alerts}
                      onChange={(checked) =>
                        updateSetting("manual_payment_alerts", checked)
                      }
                    />
                  </SettingBox>

                  <SettingBox title="How business gets notified">
                    <Checkbox
                      label="Show alerts in dashboard notification center"
                      checked={settings.dashboard_alerts}
                      onChange={(checked) =>
                        updateSetting("dashboard_alerts", checked)
                      }
                    />
                    <Checkbox
                      label="Send email notifications"
                      checked={settings.email_alerts}
                      onChange={(checked) =>
                        updateSetting("email_alerts", checked)
                      }
                    />
                    <Checkbox
                      label="Send daily email summary"
                      checked={settings.daily_email_summary}
                      onChange={(checked) =>
                        updateSetting("daily_email_summary", checked)
                      }
                    />
                    <Checkbox
                      label="Notify assigned team member"
                      checked={settings.notify_assigned_team_member}
                      onChange={(checked) =>
                        updateSetting("notify_assigned_team_member", checked)
                      }
                    />
                  </SettingBox>

                  <SettingBox title="Notification email">
                    <Field
                      label="Primary notification email"
                      value={settings.notification_email}
                      placeholder="owner@business.com"
                      onChange={(value) =>
                        updateSetting("notification_email", value)
                      }
                    />

                    <Field
                      label="Backup email optional"
                      value={settings.backup_notification_email}
                      placeholder="manager@business.com"
                      onChange={(value) =>
                        updateSetting("backup_notification_email", value)
                      }
                    />

                    <Select
                      label="Email alert frequency"
                      value={settings.email_alert_frequency}
                      options={[
                        "Send immediately",
                        "Hourly summary",
                        "Daily summary",
                        "Only urgent alerts",
                      ]}
                      onChange={(value) =>
                        updateSetting("email_alert_frequency", value)
                      }
                    />
                  </SettingBox>
                </div>

                <div className="mt-5 rounded-2xl border border-purple-400/30 bg-purple-500/10 p-5">
                  <h4 className="font-bold text-purple-100">
                    Example New Booking Alert
                  </h4>
                  <p className="mt-2 text-sm text-zinc-300">
                    Sarah Johnson booked Haircut + Beard Trim for Tuesday at
                    2:00 PM. Payment status: Pay in person.
                  </p>
                </div>
              </Card>

              <Card title="Reminder Settings">
                <p className="mb-4 text-sm text-zinc-400">
                  Reminders help businesses and customers avoid missed
                  appointments. Email reminders can be automated later. Text
                  reminders can start as one-click/manual reminders.
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  <SettingBox title="Reminder options">
                    <Checkbox
                      label="Email confirmation after booking"
                      checked={settings.email_confirmations}
                      onChange={(checked) =>
                        updateSetting("email_confirmations", checked)
                      }
                    />
                    <Checkbox
                      label="Email reminder before appointment"
                      checked={settings.email_reminders}
                      onChange={(checked) =>
                        updateSetting("email_reminders", checked)
                      }
                    />
                    <Checkbox
                      label="One-click text reminder for business"
                      checked={settings.one_click_text_reminder}
                      onChange={(checked) =>
                        updateSetting("one_click_text_reminder", checked)
                      }
                    />
                    <Checkbox
                      label="Copy reminder message button"
                      checked={settings.copy_reminder_message}
                      onChange={(checked) =>
                        updateSetting("copy_reminder_message", checked)
                      }
                    />
                  </SettingBox>

                  <SettingBox title="Default reminder timing">
                    <Select
                      label="First reminder"
                      value={settings.first_reminder_time}
                      options={[
                        "2 hours before",
                        "24 hours before",
                        "48 hours before",
                        "7 days before",
                      ]}
                      onChange={(value) =>
                        updateSetting("first_reminder_time", value)
                      }
                    />
                    <Select
                      label="Second reminder"
                      value={settings.second_reminder_time}
                      options={[
                        "None",
                        "1 hour before",
                        "2 hours before",
                        "24 hours before",
                      ]}
                      onChange={(value) =>
                        updateSetting("second_reminder_time", value)
                      }
                    />
                  </SettingBox>
                </div>
              </Card>

              <Card title="Customer Accounts">
                <p className="mb-4 text-sm text-zinc-400">
                  Customers can book as guests. After booking, they can
                  optionally create an account to manage appointments.
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  <SettingBox title="Guest booking">
                    <Checkbox
                      label="Allow customers to book without an account"
                      checked={settings.allow_guest_booking}
                      onChange={(checked) =>
                        updateSetting("allow_guest_booking", checked)
                      }
                    />
                    <Checkbox
                      label="Offer account creation after booking"
                      checked={settings.offer_customer_account}
                      onChange={(checked) =>
                        updateSetting("offer_customer_account", checked)
                      }
                    />
                    <Checkbox
                      label="Let customers view booking history"
                      checked={settings.customer_booking_history}
                      onChange={(checked) =>
                        updateSetting("customer_booking_history", checked)
                      }
                    />
                  </SettingBox>

                  <SettingBox title="Customer self-service">
                    <Checkbox
                      label="Let customers cancel based on policy"
                      checked={settings.customer_self_cancel}
                      onChange={(checked) =>
                        updateSetting("customer_self_cancel", checked)
                      }
                    />
                    <Checkbox
                      label="Let customers reschedule based on policy"
                      checked={settings.customer_self_reschedule}
                      onChange={(checked) =>
                        updateSetting("customer_self_reschedule", checked)
                      }
                    />
                    <Checkbox
                      label="Let customers see upcoming appointments"
                      checked={settings.customer_upcoming_appointments}
                      onChange={(checked) =>
                        updateSetting("customer_upcoming_appointments", checked)
                      }
                    />
                  </SettingBox>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-purple-400/30 bg-purple-500/10 p-6">
                <h3 className="text-xl font-bold">Plan</h3>
                <p className="mt-2 text-sm text-zinc-300">
                  14-day free trial
                </p>

                <div className="mt-5 rounded-2xl bg-black p-5">
                  <p className="text-sm text-zinc-500">Launch pricing</p>
                  <p className="mt-2 text-4xl font-black text-purple-300">
                    $9.99
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    per month after trial
                  </p>
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-black p-4">
                  <p className="text-sm font-semibold text-zinc-300">
                    Included with flat pricing
                  </p>

                  <div className="mt-3 space-y-2 text-sm text-zinc-400">
                    <p>✓ Public booking page</p>
                    <p>✓ Services and add-ons</p>
                    <p>✓ Up to 5 team members</p>
                    <p>✓ Appointments dashboard</p>
                    <p>✓ Deposits and payment rules</p>
                    <p>✓ Alerts and email notifications</p>
                    <p>✓ Optional customer accounts</p>
                  </div>
                </div>

                <p className="mt-4 text-sm text-zinc-400">
                  Simple launch pricing: 14 days free, then $9.99/month. No
                  complicated plans for now.
                </p>

                <button className="mt-5 w-full rounded-xl bg-purple-500 py-3 font-bold hover:bg-purple-400">
                  Manage Plan
                </button>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <h3 className="text-xl font-bold">Team Access</h3>
                <p className="mt-2 text-sm text-zinc-400">
                  Your launch plan includes up to 5 team logins.
                </p>

                <div className="mt-5 rounded-2xl bg-black p-5">
                  <p className="text-sm text-zinc-500">Logins allowed</p>
                  <p className="mt-2 text-4xl font-black text-purple-300">
                    {business.team_login_limit ?? 5}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <h3 className="text-xl font-bold">Notification Status</h3>

                <div className="mt-4 space-y-3">
                  <StatusRow
                    label="Dashboard alerts"
                    status={settings.dashboard_alerts ? "Enabled" : "Off"}
                  />
                  <StatusRow
                    label="Email alerts"
                    status={settings.email_alerts ? "Enabled" : "Off"}
                  />
                  <StatusRow
                    label="Payment alerts"
                    status={
                      settings.payment_received_alerts ? "Enabled" : "Off"
                    }
                  />
                  <StatusRow label="SMS alerts" status="Later" />
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <h3 className="text-xl font-bold">Booking Page Status</h3>

                <div className="mt-4 space-y-3">
                  <StatusRow label="Business profile" status="Complete" />
                  <StatusRow label="Services" status="Complete" />
                  <StatusRow label="Team setup" status="Complete" />
                  <StatusRow label="Payments" status="Needs review" />
                  <StatusRow label="Policies" status="Complete" />
                </div>
              </div>

              <div className="rounded-3xl border border-red-400/20 bg-red-500/5 p-6">
                <h3 className="text-xl font-bold text-red-200">
                  Account Access Rules
                </h3>
                <p className="mt-2 text-sm text-zinc-400">
                  Later, your AppointEaze owner portal can control past-due
                  billing, trial extensions, disabled booking pages, and support
                  overrides.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <h3 className="text-xl font-bold">Danger Zone</h3>
                <p className="mt-2 text-sm text-zinc-400">
                  These actions should require confirmation later.
                </p>

                <div className="mt-4 space-y-3">
                  <button className="w-full rounded-xl border border-white/10 py-3 text-sm font-bold hover:bg-white/10">
                    Pause Booking Page
                  </button>

                  <button className="w-full rounded-xl border border-red-400/30 py-3 text-sm font-bold text-red-300 hover:bg-red-500/10">
                    Delete Business Account
                  </button>
                </div>
              </div>

              <button
                onClick={saveSettings}
                disabled={saving}
                className="w-full rounded-xl bg-purple-500 py-4 font-bold hover:bg-purple-400 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <h3 className="text-2xl font-bold">{title}</h3>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function SettingBox({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-5">
      <h4 className="font-bold">{title}</h4>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-zinc-400">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm outline-none placeholder:text-zinc-600"
      />
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function Radio({
  name,
  label,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm">
      <input type="radio" name={name} checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-zinc-400">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm outline-none"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

function StatusRow({ label, status }: { label: string; status: string }) {
  const needsReview = status === "Needs review";
  const later = status === "Later";
  const off = status === "Off";

  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black px-4 py-3">
      <span className="text-sm text-zinc-300">{label}</span>
      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold ${
          needsReview
            ? "bg-yellow-500/15 text-yellow-300"
            : later
            ? "bg-purple-500/15 text-purple-300"
            : off
            ? "bg-red-500/15 text-red-300"
            : "bg-green-500/15 text-green-300"
        }`}
      >
        {status}
      </span>
    </div>
  );
}