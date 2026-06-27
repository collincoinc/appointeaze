"use client";

"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import DashboardSidebar from "../../components/DashboardSidebar";
import { supabase } from "../../lib/supabaseClient";

type AddOn = {
  id?: string;
  name: string;
  price: string;
};

type Service = {
  id?: string;
  business_id?: string;

  name: string;
  category: string;
  price: string;
  duration: string;
  description: string;
  photo_url: string;

  service_addons: AddOn[];
  allow_multiple_addons: boolean;
  show_addon_prices: boolean;

  availability_mode: string;
  allow_customer_staff_choice: boolean;
  allow_any_available: boolean;
  hide_team_selection: boolean;
  assigned_team: string[];

  payment_options: string[];
  deposit_amount: string;
  full_payment_amount: string;
  custom_payment_link: string;
  payment_instructions: string;

  deposit_due: string;
  deposit_refund_status: string;
  auto_cancel_rule: string;
  send_deposit_reminder: boolean;

  cancellation_override: boolean;
  cancellation_deadline: string;
  cancellation_policy_text: string;

  reschedule_override: boolean;
  allow_reschedule: boolean;
  require_reschedule_approval: boolean;
  reschedule_deadline: string;
  reschedule_policy_text: string;

  customer_instructions: string;
  active: boolean;
};

type Business = {
  id: string;
  name: string;
  slug: string;
};

const teamMembers = ["Marcus", "Mike", "Chris", "Any available"];

const paymentOptions = [
  "Pay in person",
  "Pay ahead in full",
  "Deposit required",
  "AppointEaze Payments — automatic tracking",
  "Custom payment link — manual tracking",
  "Cash deposit allowed — manual tracking",
];

function blankService(): Service {
  return {
    name: "",
    category: "",
    price: "",
    duration: "",
    description: "",
    photo_url: "",

    service_addons: [{ name: "", price: "" }],
    allow_multiple_addons: true,
    show_addon_prices: true,

    availability_mode: "Business-wide availability",
    allow_customer_staff_choice: true,
    allow_any_available: true,
    hide_team_selection: false,
    assigned_team: ["Any available"],

    payment_options: ["Pay in person"],
    deposit_amount: "",
    full_payment_amount: "",
    custom_payment_link: "",
    payment_instructions: "",

    deposit_due: "Immediately at booking",
    deposit_refund_status: "Non-refundable",
    auto_cancel_rule: "Business decides manually",
    send_deposit_reminder: true,

    cancellation_override: false,
    cancellation_deadline: "24 hours before",
    cancellation_policy_text: "",

    reschedule_override: false,
    allow_reschedule: true,
    require_reschedule_approval: false,
    reschedule_deadline: "24 hours before",
    reschedule_policy_text: "",

    customer_instructions: "",
    active: true,
  };
}

export default function ServicesPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Service>(blankService());

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    setLoading(true);

    const { data: businessData, error: businessError } = await supabase
      .from("businesses")
      .select("id, name, slug")
      .eq("slug", "elite-barber-studio")
      .maybeSingle();

    if (businessError || !businessData) {
      console.error("Business load error:", businessError);
      setBusiness(null);
      setServices([]);
      setLoading(false);
      return;
    }

    setBusiness(businessData as Business);

    const { data: servicesData, error: servicesError } = await supabase
      .from("services")
      .select(
        `
        *,
        service_addons (
          id,
          name,
          price
        )
      `
      )
      .eq("business_id", businessData.id)
      .eq("active", true)
      .order("created_at", { ascending: true });

    if (servicesError) {
      console.error("Services load error:", servicesError);
      setServices([]);
      setLoading(false);
      return;
    }

    const mappedServices = (servicesData || []).map((service: any) =>
      mapDatabaseServiceToDraft(service)
    );

    setServices(mappedServices);
    setLoading(false);
  }

  function mapDatabaseServiceToDraft(service: any): Service {
    return {
      id: service.id,
      business_id: service.business_id,

      name: service.name || "",
      category: service.category || "",
      price: service.price || "",
      duration: service.duration || "",
      description: service.description || "",
      photo_url: service.photo_url || "",

      service_addons:
        service.service_addons?.length > 0
          ? service.service_addons.map((addon: any) => ({
              id: addon.id,
              name: addon.name || "",
              price: addon.price || "",
            }))
          : [],

      allow_multiple_addons: true,
      show_addon_prices: true,

      availability_mode:
        service.availability_mode || "Business-wide availability",
      allow_customer_staff_choice:
        service.allow_customer_staff_choice ?? true,
      allow_any_available: service.allow_any_available ?? true,
      hide_team_selection: service.hide_team_selection ?? false,
      assigned_team: ["Any available"],

      payment_options: service.payment_options || ["Pay in person"],
      deposit_amount: service.deposit_amount || "",
      full_payment_amount: service.full_payment_amount || "",
      custom_payment_link: service.custom_payment_link || "",
      payment_instructions: service.payment_instructions || "",

      deposit_due: service.deposit_due || "Immediately at booking",
      deposit_refund_status:
        service.deposit_refund_status || "Non-refundable",
      auto_cancel_rule:
        service.auto_cancel_rule || "Business decides manually",
      send_deposit_reminder: service.send_deposit_reminder ?? true,

      cancellation_override: service.cancellation_override ?? false,
      cancellation_deadline:
        service.cancellation_deadline || "24 hours before",
      cancellation_policy_text: service.cancellation_policy_text || "",

      reschedule_override: service.reschedule_override ?? false,
      allow_reschedule: service.allow_reschedule ?? true,
      require_reschedule_approval:
        service.require_reschedule_approval ?? false,
      reschedule_deadline:
        service.reschedule_deadline || "24 hours before",
      reschedule_policy_text: service.reschedule_policy_text || "",

      customer_instructions: service.customer_instructions || "",
      active: service.active ?? true,
    };
  }

  function openAddPanel() {
    setDraft(blankService());
    setEditingId(null);
    setPanelOpen(true);
  }

  function openEditPanel(service: Service) {
    setDraft({
      ...service,
      service_addons:
        service.service_addons.length > 0
          ? service.service_addons.map((addon) => ({ ...addon }))
          : [{ name: "", price: "" }],
      payment_options: [...service.payment_options],
      assigned_team: [...service.assigned_team],
    });

    setEditingId(service.id || null);
    setPanelOpen(true);
  }

  function closePanel() {
    setDraft(blankService());
    setEditingId(null);
    setPanelOpen(false);
  }

  function updateDraft<K extends keyof Service>(key: K, value: Service[K]) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function toggleArrayValue(
    key: "payment_options" | "assigned_team",
    value: string
  ) {
    setDraft((current) => {
      const currentArray = current[key];

      const nextArray = currentArray.includes(value)
        ? currentArray.filter((item) => item !== value)
        : [...currentArray, value];

      return {
        ...current,
        [key]: nextArray,
      };
    });
  }

  function updateAddOn(index: number, key: keyof AddOn, value: string) {
    setDraft((current) => {
      const nextAddOns = [...current.service_addons];

      nextAddOns[index] = {
        ...nextAddOns[index],
        [key]: value,
      };

      return {
        ...current,
        service_addons: nextAddOns,
      };
    });
  }

  function addAddOn() {
    setDraft((current) => ({
      ...current,
      service_addons: [...current.service_addons, { name: "", price: "" }],
    }));
  }

  function removeAddOn(index: number) {
    setDraft((current) => ({
      ...current,
      service_addons: current.service_addons.filter(
        (_, addOnIndex) => addOnIndex !== index
      ),
    }));
  }

  async function saveService() {
    if (!business) {
      alert("Business not loaded yet.");
      return;
    }

    if (!draft.name.trim()) {
      alert("Service name is required.");
      return;
    }

    if (!draft.price.trim()) {
      alert("Price is required.");
      return;
    }

    if (!draft.duration.trim()) {
      alert("Duration is required.");
      return;
    }

    setSaving(true);

    const servicePayload = {
      business_id: business.id,
      name: draft.name,
      category: draft.category || null,
      price: draft.price,
      duration: draft.duration,
      description: draft.description || null,
      photo_url: draft.photo_url || null,

      availability_mode: draft.availability_mode,
      allow_customer_staff_choice: draft.allow_customer_staff_choice,
      allow_any_available: draft.allow_any_available,
      hide_team_selection: draft.hide_team_selection,

      payment_options: draft.payment_options,
      deposit_amount: draft.deposit_amount || null,
      full_payment_amount: draft.full_payment_amount || null,
      custom_payment_link: draft.custom_payment_link || null,
      payment_instructions: draft.payment_instructions || null,

      deposit_due: draft.deposit_due,
      deposit_refund_status: draft.deposit_refund_status,
      auto_cancel_rule: draft.auto_cancel_rule,
      send_deposit_reminder: draft.send_deposit_reminder,

      cancellation_override: draft.cancellation_override,
      cancellation_deadline: draft.cancellation_deadline,
      cancellation_policy_text: draft.cancellation_policy_text || null,

      reschedule_override: draft.reschedule_override,
      allow_reschedule: draft.allow_reschedule,
      require_reschedule_approval: draft.require_reschedule_approval,
      reschedule_deadline: draft.reschedule_deadline,
      reschedule_policy_text: draft.reschedule_policy_text || null,

      customer_instructions: draft.customer_instructions || null,
      active: true,
    };

    let savedServiceId = editingId;

    if (editingId) {
      const { error } = await supabase
        .from("services")
        .update(servicePayload)
        .eq("id", editingId);

      if (error) {
        console.error(error);
        alert("Could not update service.");
        setSaving(false);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("services")
        .insert(servicePayload)
        .select("id")
        .single();

      if (error || !data) {
        console.error(error);
        alert("Could not create service.");
        setSaving(false);
        return;
      }

      savedServiceId = data.id;
    }

    if (savedServiceId) {
      await supabase
        .from("service_addons")
        .delete()
        .eq("service_id", savedServiceId);

      const cleanAddOns = draft.service_addons.filter((addon) =>
        addon.name.trim()
      );

      if (cleanAddOns.length > 0) {
        const addOnPayload = cleanAddOns.map((addon) => ({
          service_id: savedServiceId,
          name: addon.name,
          price: addon.price || null,
        }));

        const { error: addOnError } = await supabase
          .from("service_addons")
          .insert(addOnPayload);

        if (addOnError) {
          console.error(addOnError);
          alert("Service saved, but add-ons could not be saved.");
        }
      }
    }

    await loadServices();
    closePanel();
    setSaving(false);
  }

  async function deleteService(service: Service) {
    if (!service.id) return;

    const confirmed = window.confirm(
      `Delete ${service.name}? This cannot be undone.`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("services")
      .update({ active: false })
      .eq("id", service.id);

    if (error) {
      console.error(error);
      alert("Could not delete service.");
      return;
    }

    await loadServices();
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="flex">
        <DashboardSidebar active="Services" />

        <section className="flex-1 p-6 lg:p-10">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm text-purple-300">Dashboard / Services</p>
              <h2 className="text-4xl font-black">Services</h2>
              <p className="mt-2 max-w-3xl text-zinc-400">
                Build your service menu, add photos, set prices, attach team
                members, create add-ons, and choose payment, deposit,
                cancellation, and reschedule rules for each service.
              </p>
            </div>

            <button
              onClick={openAddPanel}
              className="rounded-full bg-purple-500 px-6 py-3 font-bold hover:bg-purple-400"
            >
              + Add Service
            </button>
          </div>

          {loading && (
            <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-zinc-400">Loading services from Supabase...</p>
            </div>
          )}

          {!loading && !business && (
            <div className="mt-8 rounded-3xl border border-red-400/30 bg-red-500/10 p-6">
              <h3 className="text-2xl font-bold text-red-200">
                Business not found
              </h3>
              <p className="mt-2 text-sm text-zinc-300">
                The dashboard could not find Elite Barber Studio in Supabase.
              </p>
            </div>
          )}

          <div className="mt-8 grid gap-6 xl:grid-cols-3">
            <div className="space-y-5 xl:col-span-2">
              {services.length > 0 ? (
                services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onEdit={() => openEditPanel(service)}
                    onDelete={() => deleteService(service)}
                  />
                ))
              ) : (
                !loading && (
                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                    <h3 className="text-2xl font-bold">No services yet</h3>
                    <p className="mt-2 text-zinc-400">
                      Click + Add Service to create your first service.
                    </p>
                  </div>
                )
              )}
            </div>

            {panelOpen ? (
              <div className="rounded-3xl border border-purple-400/30 bg-purple-500/10 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold">
                      {editingId ? "Edit Service" : "Add Service"}
                    </h3>
                    <p className="mt-2 text-sm text-zinc-300">
                      These settings save to Supabase and control what customers
                      see on the public booking page.
                    </p>
                  </div>

                  <button
                    onClick={closePanel}
                    className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-6 space-y-4">
                  <CardSection title="Basic Service Details">
                    <Field
                      label="Service name"
                      value={draft.name}
                      placeholder="Example: Haircut"
                      onChange={(value) => updateDraft("name", value)}
                    />

                    <Field
                      label="Category optional"
                      value={draft.category}
                      placeholder="Example: Hair Services"
                      onChange={(value) => updateDraft("category", value)}
                    />

                    <Field
                      label="Price"
                      value={draft.price}
                      placeholder="$35"
                      onChange={(value) => updateDraft("price", value)}
                    />

                    <Field
                      label="Duration"
                      value={draft.duration}
                      placeholder="30 minutes"
                      onChange={(value) => updateDraft("duration", value)}
                    />

                    <div>
                      <label className="text-sm font-semibold text-zinc-300">
                        Description optional
                      </label>
                      <textarea
                        value={draft.description}
                        onChange={(event) =>
                          updateDraft("description", event.target.value)
                        }
                        placeholder="Describe what is included in this service."
                        className="mt-2 h-24 w-full resize-none rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none placeholder:text-zinc-600"
                      />
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black p-4">
                      <p className="text-sm font-semibold text-zinc-300">
                        Service photo optional
                      </p>
                      <button className="mt-3 w-full rounded-xl border border-dashed border-purple-400/40 px-4 py-6 text-sm text-purple-200 hover:bg-purple-500/10">
                        Upload service photo
                      </button>
                    </div>
                  </CardSection>

                  <CardSection title="Add-ons / Sub-services">
                    <p className="text-xs text-zinc-500">
                      Optional extras customers can add while booking this service.
                    </p>

                    <div className="mt-3 space-y-3">
                      {draft.service_addons.map((addOn, index) => (
                        <div
                          key={index}
                          className="grid gap-3 md:grid-cols-[1fr_120px_auto]"
                        >
                          <input
                            value={addOn.name}
                            onChange={(event) =>
                              updateAddOn(index, "name", event.target.value)
                            }
                            placeholder="Add-on name"
                            className="rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm outline-none placeholder:text-zinc-600"
                          />

                          <input
                            value={addOn.price}
                            onChange={(event) =>
                              updateAddOn(index, "price", event.target.value)
                            }
                            placeholder="Price"
                            className="rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm outline-none placeholder:text-zinc-600"
                          />

                          <button
                            onClick={() => removeAddOn(index)}
                            className="rounded-xl border border-red-400/30 px-4 py-3 text-sm text-red-300 hover:bg-red-500/10"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 space-y-3">
                      <Checkbox
                        label="Allow customers to choose multiple add-ons"
                        checked={draft.allow_multiple_addons}
                        onChange={(checked) =>
                          updateDraft("allow_multiple_addons", checked)
                        }
                      />

                      <Checkbox
                        label="Show add-on prices before checkout"
                        checked={draft.show_addon_prices}
                        onChange={(checked) =>
                          updateDraft("show_addon_prices", checked)
                        }
                      />
                    </div>

                    <button
                      onClick={addAddOn}
                      className="mt-3 rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
                    >
                      + Add another add-on
                    </button>
                  </CardSection>

                  <CardSection title="Availability & Team Rules">
                    <p className="text-xs text-zinc-500">
                      Choose whether this service uses business hours or a
                      specific team member’s schedule.
                    </p>

                    <div className="mt-3 space-y-3">
                      <Radio
                        name="availability-mode"
                        label="Business-wide availability"
                        checked={
                          draft.availability_mode ===
                          "Business-wide availability"
                        }
                        onChange={() =>
                          updateDraft(
                            "availability_mode",
                            "Business-wide availability"
                          )
                        }
                      />

                      <Radio
                        name="availability-mode"
                        label="Team member availability"
                        checked={
                          draft.availability_mode === "Team member availability"
                        }
                        onChange={() =>
                          updateDraft(
                            "availability_mode",
                            "Team member availability"
                          )
                        }
                      />
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-black p-4">
                      <p className="text-sm font-semibold text-zinc-300">
                        Customer staff selection
                      </p>

                      <div className="mt-3 space-y-3">
                        <Checkbox
                          label="Allow customers to choose a specific team member"
                          checked={draft.allow_customer_staff_choice}
                          onChange={(checked) =>
                            updateDraft("allow_customer_staff_choice", checked)
                          }
                        />

                        <Checkbox
                          label="Allow customers to choose Any Available"
                          checked={draft.allow_any_available}
                          onChange={(checked) =>
                            updateDraft("allow_any_available", checked)
                          }
                        />

                        <Checkbox
                          label="Hide team selection for this service"
                          checked={draft.hide_team_selection}
                          onChange={(checked) =>
                            updateDraft("hide_team_selection", checked)
                          }
                        />
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-black p-4">
                      <p className="text-sm font-semibold text-zinc-300">
                        Assign team members
                      </p>

                      <div className="mt-3 grid gap-2">
                        {teamMembers.map((member) => (
                          <Checkbox
                            key={member}
                            label={member}
                            checked={draft.assigned_team.includes(member)}
                            onChange={() =>
                              toggleArrayValue("assigned_team", member)
                            }
                          />
                        ))}
                      </div>
                    </div>
                  </CardSection>

                  <CardSection title="Payment Options For This Service">
                    <p className="text-xs text-zinc-500">
                      The business can enable one or multiple payment options
                      for each service. Customers only see the options enabled here.
                    </p>

                    <div className="mt-4 space-y-3">
                      {paymentOptions.map((option) => (
                        <Checkbox
                          key={option}
                          label={option}
                          checked={draft.payment_options.includes(option)}
                          onChange={() =>
                            toggleArrayValue("payment_options", option)
                          }
                        />
                      ))}
                    </div>
                  </CardSection>

                  <CardSection title="Pay Ahead / Deposit Details">
                    <p className="text-xs text-zinc-500">
                      These fields apply only if pay ahead, full payment, or
                      deposit is enabled for this service.
                    </p>

                    <div className="mt-4 space-y-3">
                      <Field
                        label="Deposit amount optional"
                        value={draft.deposit_amount}
                        placeholder="Example: $100"
                        onChange={(value) => updateDraft("deposit_amount", value)}
                      />

                      <Field
                        label="Full payment amount optional"
                        value={draft.full_payment_amount}
                        placeholder="Example: $55"
                        onChange={(value) =>
                          updateDraft("full_payment_amount", value)
                        }
                      />

                      <Field
                        label="Custom payment link optional"
                        value={draft.custom_payment_link}
                        placeholder="https://..."
                        onChange={(value) =>
                          updateDraft("custom_payment_link", value)
                        }
                      />

                      <div>
                        <label className="text-sm font-semibold text-zinc-300">
                          Payment instructions optional
                        </label>
                        <textarea
                          value={draft.payment_instructions}
                          onChange={(event) =>
                            updateDraft(
                              "payment_instructions",
                              event.target.value
                            )
                          }
                          placeholder="Payment instructions shown to customers."
                          className="mt-2 h-20 w-full resize-none rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none placeholder:text-zinc-600"
                        />
                      </div>
                    </div>
                  </CardSection>

                  <CardSection title="Deposit Deadline & Auto-Cancel">
                    <Select
                      label="Deposit due"
                      value={draft.deposit_due}
                      options={[
                        "Immediately at booking",
                        "Within 24 hours",
                        "Within 48 hours",
                        "7 days before appointment",
                        "Custom",
                      ]}
                      onChange={(value) => updateDraft("deposit_due", value)}
                    />

                    <div className="mt-3 space-y-3">
                      <Radio
                        name="deposit-refund"
                        label="Deposit is refundable"
                        checked={draft.deposit_refund_status === "Refundable"}
                        onChange={() =>
                          updateDraft("deposit_refund_status", "Refundable")
                        }
                      />

                      <Radio
                        name="deposit-refund"
                        label="Deposit is non-refundable"
                        checked={
                          draft.deposit_refund_status === "Non-refundable"
                        }
                        onChange={() =>
                          updateDraft(
                            "deposit_refund_status",
                            "Non-refundable"
                          )
                        }
                      />
                    </div>

                    <div className="mt-4 rounded-xl border border-white/10 bg-black p-4">
                      <p className="text-sm font-semibold text-zinc-300">
                        If deposit is not paid
                      </p>

                      <div className="mt-3 space-y-3">
                        <Radio
                          name="auto-cancel"
                          label="Business decides manually"
                          checked={
                            draft.auto_cancel_rule ===
                            "Business decides manually"
                          }
                          onChange={() =>
                            updateDraft(
                              "auto_cancel_rule",
                              "Business decides manually"
                            )
                          }
                        />

                        <Radio
                          name="auto-cancel"
                          label="Automatically cancel if deposit deadline passes"
                          checked={
                            draft.auto_cancel_rule ===
                            "Automatically cancel if deposit deadline passes"
                          }
                          onChange={() =>
                            updateDraft(
                              "auto_cancel_rule",
                              "Automatically cancel if deposit deadline passes"
                            )
                          }
                        />

                        <Checkbox
                          label="Send deposit reminder before canceling"
                          checked={draft.send_deposit_reminder}
                          onChange={(checked) =>
                            updateDraft("send_deposit_reminder", checked)
                          }
                        />
                      </div>
                    </div>
                  </CardSection>

                  <CardSection title="Cancellation Override">
                    <Checkbox
                      label="Use custom cancellation policy for this service"
                      checked={draft.cancellation_override}
                      onChange={(checked) =>
                        updateDraft("cancellation_override", checked)
                      }
                    />

                    <div className="mt-3 space-y-3">
                      <Select
                        label="Cancellation deadline"
                        value={draft.cancellation_deadline}
                        options={[
                          "2 hours before",
                          "24 hours before",
                          "48 hours before",
                          "7 days before",
                          "No customer cancellations",
                          "Custom",
                        ]}
                        onChange={(value) =>
                          updateDraft("cancellation_deadline", value)
                        }
                      />

                      <textarea
                        value={draft.cancellation_policy_text}
                        onChange={(event) =>
                          updateDraft(
                            "cancellation_policy_text",
                            event.target.value
                          )
                        }
                        placeholder="Cancellation policy shown to customers for this service."
                        className="h-20 w-full resize-none rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none placeholder:text-zinc-600"
                      />
                    </div>
                  </CardSection>

                  <CardSection title="Reschedule Override">
                    <Checkbox
                      label="Use custom reschedule policy for this service"
                      checked={draft.reschedule_override}
                      onChange={(checked) =>
                        updateDraft("reschedule_override", checked)
                      }
                    />

                    <div className="mt-3 space-y-3">
                      <Checkbox
                        label="Allow customer to reschedule this service"
                        checked={draft.allow_reschedule}
                        onChange={(checked) =>
                          updateDraft("allow_reschedule", checked)
                        }
                      />

                      <Checkbox
                        label="Require business approval for reschedules"
                        checked={draft.require_reschedule_approval}
                        onChange={(checked) =>
                          updateDraft("require_reschedule_approval", checked)
                        }
                      />

                      <Select
                        label="Reschedule deadline"
                        value={draft.reschedule_deadline}
                        options={[
                          "2 hours before",
                          "24 hours before",
                          "48 hours before",
                          "7 days before",
                          "No customer reschedules",
                          "Custom",
                        ]}
                        onChange={(value) =>
                          updateDraft("reschedule_deadline", value)
                        }
                      />

                      <textarea
                        value={draft.reschedule_policy_text}
                        onChange={(event) =>
                          updateDraft(
                            "reschedule_policy_text",
                            event.target.value
                          )
                        }
                        placeholder="Reschedule policy shown to customers for this service."
                        className="h-20 w-full resize-none rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none placeholder:text-zinc-600"
                      />
                    </div>
                  </CardSection>

                  <CardSection title="Customer-facing Instructions">
                    <textarea
                      value={draft.customer_instructions}
                      onChange={(event) =>
                        updateDraft("customer_instructions", event.target.value)
                      }
                      placeholder="Example: Please arrive 10 minutes early. For tattoo appointments, deposits are non-refundable and required to hold your time."
                      className="h-28 w-full resize-none rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none placeholder:text-zinc-600"
                    />
                  </CardSection>

                  <button
                    onClick={saveService}
                    disabled={saving}
                    className="w-full rounded-xl bg-purple-500 py-4 font-bold hover:bg-purple-400 disabled:opacity-60"
                  >
                    {saving
                      ? "Saving..."
                      : editingId
                      ? "Save Changes"
                      : "Save Service"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-3xl border border-purple-400/30 bg-purple-500/10 p-6">
                  <h3 className="text-2xl font-bold">Service Panel</h3>
                  <p className="mt-2 text-sm text-zinc-300">
                    Click + Add Service or Edit to open the service setup panel.
                  </p>

                  <button
                    onClick={openAddPanel}
                    className="mt-6 w-full rounded-xl bg-purple-500 py-4 font-bold hover:bg-purple-400"
                  >
                    + Add Service
                  </button>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                  <h3 className="text-xl font-bold">Supabase Status</h3>
                  <p className="mt-2 text-sm text-zinc-400">
                    Services loaded from the database:
                  </p>
                  <p className="mt-3 text-4xl font-black text-purple-300">
                    {services.length}
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                  <h3 className="text-xl font-bold">Service Rules</h3>

                  <div className="mt-4 space-y-3 text-sm text-zinc-300">
                    <p>✓ Per-service payment options</p>
                    <p>✓ Deposits per service</p>
                    <p>✓ Add-ons per service</p>
                    <p>✓ Team selection per service</p>
                    <p>✓ Cancellation overrides</p>
                    <p>✓ Reschedule overrides</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function ServiceCard({
  service,
  onEdit,
  onDelete,
}: {
  service: Service;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const badge = getServiceBadge(service);
  const addOns = service.service_addons || [];

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex flex-col gap-5 md:flex-row">
        <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-purple-500/10 text-sm text-purple-300">
          Service Photo
        </div>

        <div className="flex-1">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-2xl font-bold">{service.name}</h3>
                <span className={serviceBadgeClass(badge)}>{badge}</span>
              </div>

              <p className="mt-1 text-zinc-400">
                {service.price} • {service.duration}
              </p>

              {service.category && (
                <p className="mt-1 text-sm text-purple-300">
                  {service.category}
                </p>
              )}

              {service.description && (
                <p className="mt-2 text-sm text-zinc-500">
                  {service.description}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={onEdit}
                className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              >
                Edit
              </button>

              <button
                onClick={onDelete}
                className="rounded-full border border-red-400/30 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10"
              >
                Delete
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <Info label="Availability mode" value={service.availability_mode} />

            <Info
              label="Payment options"
              value={
                service.payment_options.length
                  ? service.payment_options.join(", ")
                  : "Pay in person"
              }
            />

            <Info
              label="Deposit"
              value={service.deposit_amount || "No deposit amount set"}
            />

            <Info
              label="Full payment"
              value={service.full_payment_amount || "No full payment amount set"}
            />

            <Info
              label="Add-ons"
              value={
                addOns.filter((addon) => addon.name).length
                  ? addOns
                      .filter((addon) => addon.name)
                      .map((addon) => `${addon.name} ${addon.price || ""}`)
                      .join(", ")
                  : "None"
              }
            />

            <Info label="Deposit due" value={service.deposit_due} />

            <Info
              label="Cancellation"
              value={
                service.cancellation_override
                  ? `Custom: ${service.cancellation_deadline}`
                  : "Uses business default"
              }
            />

            <Info
              label="Reschedule"
              value={
                service.reschedule_override
                  ? `Custom: ${service.reschedule_deadline}`
                  : "Uses business default"
              }
            />
          </div>

          {service.customer_instructions && (
            <div className="mt-4 rounded-2xl border border-purple-400/20 bg-purple-500/10 p-4">
              <p className="text-xs text-purple-300">Customer instructions</p>
              <p className="mt-2 text-sm text-zinc-300">
                {service.customer_instructions}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-zinc-200">{value}</p>
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
      <label className="text-sm font-semibold text-zinc-300">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none placeholder:text-zinc-600"
      />
    </div>
  );
}

function CardSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <p className="text-sm font-semibold text-zinc-300">{title}</p>
      <div className="mt-3">{children}</div>
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
        className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

function getServiceBadge(service: Service) {
  const options = service.payment_options || [];

  if (options.includes("Deposit required")) {
    return "Deposit required";
  }

  if (options.includes("Pay ahead in full")) {
    return "Full payment";
  }

  if (
    options.includes("Pay in person") &&
    options.includes("AppointEaze Payments — automatic tracking")
  ) {
    return "Flexible payment";
  }

  return "No deposit";
}

function serviceBadgeClass(badge: string) {
  if (badge === "No deposit") {
    return "rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-300";
  }

  if (badge === "Flexible payment") {
    return "rounded-full bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-300";
  }

  if (badge === "Deposit required") {
    return "rounded-full bg-yellow-500/15 px-3 py-1 text-xs font-semibold text-yellow-300";
  }

  if (badge === "Full payment") {
    return "rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-200";
  }

  return "rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-zinc-300";
}