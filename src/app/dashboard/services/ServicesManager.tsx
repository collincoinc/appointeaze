"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import DashboardSidebar from "../../components/DashboardSidebar";

type AddOn = {
  name: string;
  price: string;
};

type Service = {
  id: string;
  name: string;
  category: string;
  price: string;
  duration: string;
  description: string;
  photoLabel: string;

  addOns: AddOn[];
  allowMultipleAddOns: boolean;
  showAddOnPrices: boolean;

  availabilityMode: "Business-wide availability" | "Team member availability";
  allowCustomerStaffChoice: boolean;
  allowAnyAvailable: boolean;
  hideTeamSelection: boolean;
  assignedTeam: string[];

  paymentOptions: string[];
  depositAmount: string;
  fullPaymentAmount: string;
  customPaymentLink: string;
  paymentInstructions: string;

  depositDue: string;
  depositRefundStatus: "Refundable" | "Non-refundable";
  autoCancelRule: string;
  sendDepositReminder: boolean;

  cancellationOverride: boolean;
  cancellationDeadline: string;
  cancellationPolicyText: string;

  rescheduleOverride: boolean;
  allowReschedule: boolean;
  requireRescheduleApproval: boolean;
  rescheduleDeadline: string;
  reschedulePolicyText: string;

  customerInstructions: string;
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

function blankService(id = "new-service"): Service {
  return {
    id,
    name: "",
    category: "",
    price: "",
    duration: "",
    description: "",
    photoLabel: "Service Photo",

    addOns: [{ name: "", price: "" }],
    allowMultipleAddOns: true,
    showAddOnPrices: true,

    availabilityMode: "Business-wide availability",
    allowCustomerStaffChoice: true,
    allowAnyAvailable: true,
    hideTeamSelection: false,
    assignedTeam: ["Any available"],

    paymentOptions: ["Pay in person"],
    depositAmount: "",
    fullPaymentAmount: "",
    customPaymentLink: "",
    paymentInstructions: "",

    depositDue: "Immediately at booking",
    depositRefundStatus: "Non-refundable",
    autoCancelRule: "Business decides manually",
    sendDepositReminder: true,

    cancellationOverride: false,
    cancellationDeadline: "24 hours before",
    cancellationPolicyText: "",

    rescheduleOverride: false,
    allowReschedule: true,
    requireRescheduleApproval: false,
    rescheduleDeadline: "24 hours before",
    reschedulePolicyText: "",

    customerInstructions: "",
  };
}

const starterServices: Service[] = [
  {
    ...blankService("haircut"),
    name: "Haircut",
    category: "Hair Services",
    price: "$35",
    duration: "30 min",
    description: "Classic haircut with optional add-ons.",
    availabilityMode: "Business-wide availability",
    paymentOptions: [
      "Pay in person",
      "Pay ahead in full",
      "AppointEaze Payments — automatic tracking",
    ],
    assignedTeam: ["Any available"],
    addOns: [
      { name: "Beard trim", price: "$10" },
      { name: "Hair wash", price: "$5" },
    ],
    cancellationDeadline: "2 hours before",
  },
  {
    ...blankService("tattoo"),
    name: "Tattoo Session",
    category: "Tattoo Services",
    price: "$400",
    duration: "3 hr",
    description: "Custom tattoo session with optional color detail.",
    availabilityMode: "Team member availability",
    paymentOptions: [
      "Deposit required",
      "AppointEaze Payments — automatic tracking",
      "Cash deposit allowed — manual tracking",
    ],
    depositAmount: "$100",
    assignedTeam: ["Marcus"],
    addOns: [
      { name: "Color detail", price: "$75" },
      { name: "Touch-up", price: "$50" },
    ],
    depositRefundStatus: "Non-refundable",
    rescheduleOverride: true,
    requireRescheduleApproval: true,
    customerInstructions:
      "A deposit is required to hold tattoo appointments. Deposits may be non-refundable based on shop policy.",
  },
  {
    ...blankService("full-service"),
    name: "Full Service",
    category: "Hair Services",
    price: "$55",
    duration: "45 min",
    description: "Haircut, beard trim, and styling.",
    availabilityMode: "Team member availability",
    paymentOptions: [
      "Pay ahead in full",
      "Custom payment link — manual tracking",
      "AppointEaze Payments — automatic tracking",
    ],
    fullPaymentAmount: "$55",
    assignedTeam: ["Mike", "Chris"],
    addOns: [{ name: "Design", price: "$15" }],
  },
];

function cloneService(service: Service): Service {
  return {
    ...service,
    addOns: service.addOns.map((addOn) => ({ ...addOn })),
    assignedTeam: [...service.assignedTeam],
    paymentOptions: [...service.paymentOptions],
  };
}

function createNewId() {
  return `service-${Date.now()}`;
}

export default function ServicesManager() {
  const [services, setServices] = useState<Service[]>(starterServices);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Service>(blankService());

  function openAddPanel() {
    setDraft(blankService(createNewId()));
    setEditingId(null);
    setPanelOpen(true);
  }

  function openEditPanel(service: Service) {
    setDraft(cloneService(service));
    setEditingId(service.id);
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
    setEditingId(null);
    setDraft(blankService());
  }

  function saveService() {
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

    if (editingId) {
      setServices((current) =>
        current.map((service) =>
          service.id === editingId ? cloneService(draft) : service
        )
      );
    } else {
      setServices((current) => [cloneService(draft), ...current]);
    }

    closePanel();
  }

  function deleteService(serviceId: string) {
    const service = services.find((item) => item.id === serviceId);

    const confirmed = window.confirm(
      `Delete ${service?.name || "this service"}? This cannot be undone.`
    );

    if (!confirmed) return;

    setServices((current) => current.filter((item) => item.id !== serviceId));
  }

  function updateDraft<K extends keyof Service>(key: K, value: Service[K]) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function toggleArrayValue(key: "paymentOptions" | "assignedTeam", value: string) {
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
      const nextAddOns = [...current.addOns];

      nextAddOns[index] = {
        ...nextAddOns[index],
        [key]: value,
      };

      return {
        ...current,
        addOns: nextAddOns,
      };
    });
  }

  function addAddOn() {
    setDraft((current) => ({
      ...current,
      addOns: [...current.addOns, { name: "", price: "" }],
    }));
  }

  function removeAddOn(index: number) {
    setDraft((current) => ({
      ...current,
      addOns: current.addOns.filter((_, addOnIndex) => addOnIndex !== index),
    }));
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

          <div className="mt-8 grid gap-6 xl:grid-cols-3">
            <div className="space-y-5 xl:col-span-2">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onEdit={() => openEditPanel(service)}
                  onDelete={() => deleteService(service.id)}
                />
              ))}
            </div>

            {panelOpen ? (
              <div className="rounded-3xl border border-purple-400/30 bg-purple-500/10 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold">
                      {editingId ? "Edit Service" : "Add Service"}
                    </h3>
                    <p className="mt-2 text-sm text-zinc-300">
                      This is temporary for now. Later, these fields will save
                      permanently to the database.
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
                      {draft.addOns.map((addOn, index) => (
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
                        checked={draft.allowMultipleAddOns}
                        onChange={(checked) =>
                          updateDraft("allowMultipleAddOns", checked)
                        }
                      />
                      <Checkbox
                        label="Show add-on prices before checkout"
                        checked={draft.showAddOnPrices}
                        onChange={(checked) =>
                          updateDraft("showAddOnPrices", checked)
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

                    <div className="mt-3 space-y-3 text-sm">
                      <Radio
                        name="availability-mode"
                        label="Business-wide availability"
                        checked={
                          draft.availabilityMode ===
                          "Business-wide availability"
                        }
                        onChange={() =>
                          updateDraft(
                            "availabilityMode",
                            "Business-wide availability"
                          )
                        }
                      />
                      <Radio
                        name="availability-mode"
                        label="Team member availability"
                        checked={
                          draft.availabilityMode === "Team member availability"
                        }
                        onChange={() =>
                          updateDraft(
                            "availabilityMode",
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
                          checked={draft.allowCustomerStaffChoice}
                          onChange={(checked) =>
                            updateDraft("allowCustomerStaffChoice", checked)
                          }
                        />
                        <Checkbox
                          label="Allow customers to choose Any Available"
                          checked={draft.allowAnyAvailable}
                          onChange={(checked) =>
                            updateDraft("allowAnyAvailable", checked)
                          }
                        />
                        <Checkbox
                          label="Hide team selection for this service"
                          checked={draft.hideTeamSelection}
                          onChange={(checked) =>
                            updateDraft("hideTeamSelection", checked)
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
                            checked={draft.assignedTeam.includes(member)}
                            onChange={() =>
                              toggleArrayValue("assignedTeam", member)
                            }
                          />
                        ))}
                      </div>
                    </div>
                  </CardSection>

                  <CardSection title="Payment Options For This Service">
                    <p className="text-xs text-zinc-500">
                      The business can enable one or multiple payment options for
                      each service. Customers only see the options enabled here.
                    </p>

                    <div className="mt-4 space-y-3">
                      {paymentOptions.map((option) => (
                        <Checkbox
                          key={option}
                          label={option}
                          checked={draft.paymentOptions.includes(option)}
                          onChange={() =>
                            toggleArrayValue("paymentOptions", option)
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
                        value={draft.depositAmount}
                        placeholder="Example: $100"
                        onChange={(value) => updateDraft("depositAmount", value)}
                      />

                      <Field
                        label="Full payment amount optional"
                        value={draft.fullPaymentAmount}
                        placeholder="Example: $55"
                        onChange={(value) =>
                          updateDraft("fullPaymentAmount", value)
                        }
                      />

                      <Field
                        label="Custom payment link optional"
                        value={draft.customPaymentLink}
                        placeholder="https://..."
                        onChange={(value) =>
                          updateDraft("customPaymentLink", value)
                        }
                      />

                      <div>
                        <label className="text-sm font-semibold text-zinc-300">
                          Payment instructions optional
                        </label>
                        <textarea
                          value={draft.paymentInstructions}
                          onChange={(event) =>
                            updateDraft(
                              "paymentInstructions",
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
                      value={draft.depositDue}
                      options={[
                        "Immediately at booking",
                        "Within 24 hours",
                        "Within 48 hours",
                        "7 days before appointment",
                        "Custom",
                      ]}
                      onChange={(value) => updateDraft("depositDue", value)}
                    />

                    <div className="mt-3 space-y-3">
                      <Radio
                        name="deposit-refund"
                        label="Deposit is refundable"
                        checked={draft.depositRefundStatus === "Refundable"}
                        onChange={() =>
                          updateDraft("depositRefundStatus", "Refundable")
                        }
                      />
                      <Radio
                        name="deposit-refund"
                        label="Deposit is non-refundable"
                        checked={
                          draft.depositRefundStatus === "Non-refundable"
                        }
                        onChange={() =>
                          updateDraft("depositRefundStatus", "Non-refundable")
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
                            draft.autoCancelRule === "Business decides manually"
                          }
                          onChange={() =>
                            updateDraft(
                              "autoCancelRule",
                              "Business decides manually"
                            )
                          }
                        />
                        <Radio
                          name="auto-cancel"
                          label="Automatically cancel if deposit deadline passes"
                          checked={
                            draft.autoCancelRule ===
                            "Automatically cancel if deposit deadline passes"
                          }
                          onChange={() =>
                            updateDraft(
                              "autoCancelRule",
                              "Automatically cancel if deposit deadline passes"
                            )
                          }
                        />
                        <Checkbox
                          label="Send deposit reminder before canceling"
                          checked={draft.sendDepositReminder}
                          onChange={(checked) =>
                            updateDraft("sendDepositReminder", checked)
                          }
                        />
                      </div>
                    </div>
                  </CardSection>

                  <CardSection title="Cancellation Override">
                    <Checkbox
                      label="Use custom cancellation policy for this service"
                      checked={draft.cancellationOverride}
                      onChange={(checked) =>
                        updateDraft("cancellationOverride", checked)
                      }
                    />

                    <div className="mt-3 space-y-3">
                      <Select
                        label="Cancellation deadline"
                        value={draft.cancellationDeadline}
                        options={[
                          "2 hours before",
                          "24 hours before",
                          "48 hours before",
                          "7 days before",
                          "No customer cancellations",
                          "Custom",
                        ]}
                        onChange={(value) =>
                          updateDraft("cancellationDeadline", value)
                        }
                      />

                      <textarea
                        value={draft.cancellationPolicyText}
                        onChange={(event) =>
                          updateDraft(
                            "cancellationPolicyText",
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
                      checked={draft.rescheduleOverride}
                      onChange={(checked) =>
                        updateDraft("rescheduleOverride", checked)
                      }
                    />

                    <div className="mt-3 space-y-3">
                      <Checkbox
                        label="Allow customer to reschedule this service"
                        checked={draft.allowReschedule}
                        onChange={(checked) =>
                          updateDraft("allowReschedule", checked)
                        }
                      />

                      <Checkbox
                        label="Require business approval for reschedules"
                        checked={draft.requireRescheduleApproval}
                        onChange={(checked) =>
                          updateDraft("requireRescheduleApproval", checked)
                        }
                      />

                      <Select
                        label="Reschedule deadline"
                        value={draft.rescheduleDeadline}
                        options={[
                          "2 hours before",
                          "24 hours before",
                          "48 hours before",
                          "7 days before",
                          "No customer reschedules",
                          "Custom",
                        ]}
                        onChange={(value) =>
                          updateDraft("rescheduleDeadline", value)
                        }
                      />

                      <textarea
                        value={draft.reschedulePolicyText}
                        onChange={(event) =>
                          updateDraft(
                            "reschedulePolicyText",
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
                      value={draft.customerInstructions}
                      onChange={(event) =>
                        updateDraft("customerInstructions", event.target.value)
                      }
                      placeholder="Example: Please arrive 10 minutes early. For tattoo appointments, deposits are non-refundable and required to hold your time."
                      className="h-28 w-full resize-none rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none placeholder:text-zinc-600"
                    />
                  </CardSection>

                  <button
                    onClick={saveService}
                    className="w-full rounded-xl bg-purple-500 py-4 font-bold hover:bg-purple-400"
                  >
                    {editingId ? "Save Changes" : "Save Service"}
                  </button>
                </div>
              </div>
            ) : (
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

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex flex-col gap-5 md:flex-row">
        <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-purple-500/10 text-sm text-purple-300">
          {service.photoLabel}
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
            <Info label="Availability mode" value={service.availabilityMode} />
            <Info
              label="Payment options"
              value={
                service.paymentOptions.length
                  ? service.paymentOptions.join(", ")
                  : "None"
              }
            />
            <Info
              label="Assigned team"
              value={
                service.assignedTeam.length
                  ? service.assignedTeam.join(", ")
                  : "None"
              }
            />
            <Info
              label="Add-ons"
              value={
                service.addOns.filter((item) => item.name).length
                  ? service.addOns
                      .filter((item) => item.name)
                      .map((item) => `${item.name} ${item.price}`)
                      .join(", ")
                  : "None"
              }
            />
            <Info
              label="Deposit"
              value={service.depositAmount || "No deposit amount set"}
            />
            <Info
              label="Policy rules"
              value={
                service.cancellationOverride || service.rescheduleOverride
                  ? "Custom service rules enabled"
                  : "Uses business defaults"
              }
            />
          </div>
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
  if (service.paymentOptions.includes("Deposit required")) {
    return "Deposit required";
  }

  if (service.paymentOptions.includes("Pay ahead in full")) {
    return "Full payment";
  }

  if (
    service.paymentOptions.includes("Pay in person") &&
    service.paymentOptions.includes("AppointEaze Payments — automatic tracking")
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