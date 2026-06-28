"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import DashboardSidebar from "../../components/DashboardSidebar";
import { supabase } from "../../lib/supabaseClient";

type CurrentUser = {
  id: string;
  email: string | null;
};

type Business = {
  id: string;
  name: string;
  slug: string;
};

type ServiceAddOn = {
  id?: string;
  name: string;
  price: string | null;
};

type Service = {
  id: string;
  business_id: string;
  name: string;
  category: string | null;
  price: string;
  duration: string;
  description: string | null;
  photo_url: string | null;
  active: boolean | null;
  payment_options: string[] | null;
  deposit_amount: string | null;
  full_payment_amount: string | null;
  custom_payment_link: string | null;
  payment_instructions: string | null;
  deposit_due: string | null;
  deposit_refund_status: string | null;
  cancellation_deadline: string | null;
  cancellation_policy_text: string | null;
  reschedule_deadline: string | null;
  reschedule_policy_text: string | null;
  allow_reschedule: boolean | null;
  customer_instructions: string | null;
  service_addons?: ServiceAddOn[];
};

type ServiceForm = {
  name: string;
  category: string;
  price: string;
  duration: string;
  description: string;
  photo_url: string;
  active: boolean;
  payment_options: string[];
  deposit_amount: string;
  full_payment_amount: string;
  custom_payment_link: string;
  payment_instructions: string;
  deposit_due: string;
  deposit_refund_status: string;
  cancellation_deadline: string;
  cancellation_policy_text: string;
  reschedule_deadline: string;
  reschedule_policy_text: string;
  allow_reschedule: boolean;
  customer_instructions: string;
  addOns: ServiceAddOn[];
};

const paymentOptions = [
  "Pay in person",
  "Deposit required",
  "Pay ahead in full",
  "Custom payment link — manual tracking",
  "Cash deposit allowed — manual tracking",
];

const emptyForm: ServiceForm = {
  name: "",
  category: "",
  price: "",
  duration: "30 minutes",
  description: "",
  photo_url: "",
  active: true,
  payment_options: ["Pay in person"],
  deposit_amount: "",
  full_payment_amount: "",
  custom_payment_link: "",
  payment_instructions: "",
  deposit_due: "Immediately at booking",
  deposit_refund_status: "Non-refundable",
  cancellation_deadline: "24 hours before appointment",
  cancellation_policy_text: "",
  reschedule_deadline: "24 hours before appointment",
  reschedule_policy_text: "",
  allow_reschedule: true,
  customer_instructions: "",
  addOns: [],
};

export default function ServicesPage() {
  const formRef = useRef<HTMLDivElement | null>(null);

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [checkingUser, setCheckingUser] = useState(true);

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [services, setServices] = useState<Service[]>([]);

  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [editingServiceId, setEditingServiceId] = useState("");
  const [loading, setLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedBusiness = useMemo(() => {
    return (
      businesses.find((business) => business.id === selectedBusinessId) || null
    );
  }, [businesses, selectedBusinessId]);

  useEffect(() => {
    loadCurrentUserAndBusinesses();
  }, []);

  useEffect(() => {
    if (selectedBusinessId) {
      loadServices(selectedBusinessId);
      localStorage.setItem("appointeaze_selected_business_id", selectedBusinessId);
    }
  }, [selectedBusinessId]);

  async function loadCurrentUserAndBusinesses() {
    setCheckingUser(true);
    setLoading(true);
    setError("");

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      setCurrentUser(null);
      setCheckingUser(false);
      setLoading(false);
      return;
    }

    const user = {
      id: userData.user.id,
      email: userData.user.email || null,
    };

    setCurrentUser(user);
    setCheckingUser(false);

    await loadBusinesses(user.id);
  }

  async function loadBusinesses(ownerId: string) {
    setLoading(true);
    setError("");

    const { data, error: businessError } = await supabase
      .from("businesses")
      .select("id, name, slug")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });

    if (businessError) {
      console.error("Business load error:", businessError);
      setError(businessError.message || "Could not load businesses.");
      setLoading(false);
      return;
    }

    const loadedBusinesses = (data || []) as Business[];
    setBusinesses(loadedBusinesses);

    const savedBusinessId = localStorage.getItem(
      "appointeaze_selected_business_id"
    );

    const savedStillExists = loadedBusinesses.some(
      (business) => business.id === savedBusinessId
    );

    if (savedBusinessId && savedStillExists) {
      setSelectedBusinessId(savedBusinessId);
    } else if (loadedBusinesses.length > 0) {
      setSelectedBusinessId(loadedBusinesses[0].id);
    } else {
      setSelectedBusinessId("");
      setServices([]);
    }

    setLoading(false);
  }

  async function loadServices(businessId: string) {
    setServicesLoading(true);
    setError("");

    const { data, error: servicesError } = await supabase
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
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (servicesError) {
      console.error("Services load error:", servicesError);
      setError(servicesError.message || "Could not load services.");
      setServicesLoading(false);
      return;
    }

    setServices((data || []) as Service[]);
    setServicesLoading(false);
  }

  function updateForm<K extends keyof ServiceForm>(
    key: K,
    value: ServiceForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function togglePaymentOption(option: string) {
    setForm((current) => {
      const exists = current.payment_options.includes(option);

      const nextOptions = exists
        ? current.payment_options.filter((item) => item !== option)
        : [...current.payment_options, option];

      return {
        ...current,
        payment_options: nextOptions,
      };
    });
  }

  function addAddOnRow() {
    setForm((current) => ({
      ...current,
      addOns: [...current.addOns, { name: "", price: "" }],
    }));
  }

  function updateAddOn(index: number, key: "name" | "price", value: string) {
    setForm((current) => {
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

  function removeAddOn(index: number) {
    setForm((current) => ({
      ...current,
      addOns: current.addOns.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function scrollToForm() {
    setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }

  function startNewService() {
    setForm(emptyForm);
    setEditingServiceId("");
    setMessage("");
    setError("");
    scrollToForm();
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingServiceId("");
    setMessage("");
    setError("");
  }

  async function uploadServicePhoto(file: File) {
    setError("");
    setMessage("");

    if (!selectedBusiness) {
      setError("Please choose a business before uploading a photo.");
      return;
    }

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    setUploadingPhoto(true);

    const extension = file.name.split(".").pop() || "jpg";
    const fileName = `${selectedBusiness.id}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("service-photos")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Photo upload error:", uploadError);
      setError(uploadError.message || "Could not upload photo.");
      setUploadingPhoto(false);
      return;
    }

    const { data } = supabase.storage
      .from("service-photos")
      .getPublicUrl(fileName);

    updateForm("photo_url", data.publicUrl);
    setUploadingPhoto(false);
    setMessage("Photo uploaded. Save the service to keep it.");
  }

  function editService(service: Service) {
    setEditingServiceId(service.id);
    setMessage("");
    setError("");

    setForm({
      name: service.name || "",
      category: service.category || "",
      price: service.price || "",
      duration: service.duration || "30 minutes",
      description: service.description || "",
      photo_url: service.photo_url || "",
      active: service.active ?? true,
      payment_options:
        service.payment_options && service.payment_options.length > 0
          ? service.payment_options
          : ["Pay in person"],
      deposit_amount: service.deposit_amount || "",
      full_payment_amount: service.full_payment_amount || "",
      custom_payment_link: service.custom_payment_link || "",
      payment_instructions: service.payment_instructions || "",
      deposit_due: service.deposit_due || "Immediately at booking",
      deposit_refund_status: service.deposit_refund_status || "Non-refundable",
      cancellation_deadline:
        service.cancellation_deadline || "24 hours before appointment",
      cancellation_policy_text: service.cancellation_policy_text || "",
      reschedule_deadline:
        service.reschedule_deadline || "24 hours before appointment",
      reschedule_policy_text: service.reschedule_policy_text || "",
      allow_reschedule: service.allow_reschedule ?? true,
      customer_instructions: service.customer_instructions || "",
      addOns: service.service_addons || [],
    });

    scrollToForm();
  }

  async function saveService() {
    setSaving(true);
    setMessage("");
    setError("");

    if (!selectedBusiness) {
      setError("Please choose a business first.");
      setSaving(false);
      return;
    }

    if (!form.name.trim()) {
      setError("Please enter a service name.");
      setSaving(false);
      return;
    }

    if (!form.price.trim()) {
      setError("Please enter a price.");
      setSaving(false);
      return;
    }

    if (!form.duration.trim()) {
      setError("Please enter a duration.");
      setSaving(false);
      return;
    }

    const servicePayload = {
      business_id: selectedBusiness.id,
      name: form.name.trim(),
      category: form.category.trim() || null,
      price: form.price.trim(),
      duration: form.duration.trim(),
      description: form.description.trim() || null,
      photo_url: form.photo_url.trim() || null,
      active: form.active,
      payment_options: form.payment_options,
      deposit_amount: form.deposit_amount.trim() || null,
      full_payment_amount: form.full_payment_amount.trim() || null,
      custom_payment_link: form.custom_payment_link.trim() || null,
      payment_instructions: form.payment_instructions.trim() || null,
      deposit_due: form.deposit_due.trim() || null,
      deposit_refund_status: form.deposit_refund_status.trim() || null,
      cancellation_deadline: form.cancellation_deadline.trim() || null,
      cancellation_policy_text: form.cancellation_policy_text.trim() || null,
      reschedule_deadline: form.reschedule_deadline.trim() || null,
      reschedule_policy_text: form.reschedule_policy_text.trim() || null,
      allow_reschedule: form.allow_reschedule,
      customer_instructions: form.customer_instructions.trim() || null,
    };

    let serviceId = editingServiceId;

    if (editingServiceId) {
      const { error: updateError } = await supabase
        .from("services")
        .update(servicePayload)
        .eq("id", editingServiceId)
        .eq("business_id", selectedBusiness.id);

      if (updateError) {
        console.error("Service update error:", updateError);
        setError(updateError.message || "Could not update service.");
        setSaving(false);
        return;
      }
    } else {
      const { data: createdService, error: insertError } = await supabase
        .from("services")
        .insert(servicePayload)
        .select("id")
        .single();

      if (insertError || !createdService) {
        console.error("Service insert error:", insertError);
        setError(insertError?.message || "Could not create service.");
        setSaving(false);
        return;
      }

      serviceId = createdService.id;
    }

    const { error: deleteAddOnsError } = await supabase
      .from("service_addons")
      .delete()
      .eq("service_id", serviceId);

    if (deleteAddOnsError) {
      console.error("Add-on delete error:", deleteAddOnsError);
      setError(deleteAddOnsError.message || "Could not update service add-ons.");
      setSaving(false);
      return;
    }

    const cleanedAddOns = form.addOns
      .map((addon) => ({
        service_id: serviceId,
        name: addon.name.trim(),
        price: addon.price?.trim() || null,
      }))
      .filter((addon) => addon.name.length > 0);

    if (cleanedAddOns.length > 0) {
      const { error: addOnInsertError } = await supabase
        .from("service_addons")
        .insert(cleanedAddOns);

      if (addOnInsertError) {
        console.error("Add-on insert error:", addOnInsertError);
        setError(addOnInsertError.message || "Could not save service add-ons.");
        setSaving(false);
        return;
      }
    }

    setMessage(editingServiceId ? "Service updated." : "Service created.");
    setSaving(false);
    resetForm();
    await loadServices(selectedBusiness.id);
  }

  async function deleteService(serviceId: string) {
    const confirmed = window.confirm(
      "Delete this service? This removes it from the booking page."
    );

    if (!confirmed) {
      return;
    }

    if (!selectedBusiness) {
      setError("Please choose a business first.");
      return;
    }

    setError("");
    setMessage("");

    const { error: deleteError } = await supabase
      .from("services")
      .delete()
      .eq("id", serviceId)
      .eq("business_id", selectedBusiness.id);

    if (deleteError) {
      console.error("Service delete error:", deleteError);
      setError(deleteError.message || "Could not delete service.");
      return;
    }

    setMessage("Service deleted.");
    await loadServices(selectedBusiness.id);
  }

  async function toggleActive(service: Service) {
    setError("");
    setMessage("");

    if (!selectedBusiness) {
      setError("Please choose a business first.");
      return;
    }

    const { error: updateError } = await supabase
      .from("services")
      .update({
        active: !(service.active ?? true),
      })
      .eq("id", service.id)
      .eq("business_id", selectedBusiness.id);

    if (updateError) {
      console.error("Active toggle error:", updateError);
      setError(updateError.message || "Could not update service.");
      return;
    }

    await loadServices(selectedBusiness.id);
  }

  if (checkingUser) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="flex">
          <DashboardSidebar active="Services" />
          <section className="flex-1 p-6 lg:p-10">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-zinc-300">Checking account...</p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="flex">
          <DashboardSidebar active="Services" />
          <section className="flex-1 p-6 lg:p-10">
            <div className="rounded-3xl border border-yellow-400/30 bg-yellow-500/10 p-6">
              <h1 className="text-3xl font-black text-yellow-200">
                Log in required
              </h1>
              <p className="mt-2 text-zinc-300">
                Please log in before managing services.
              </p>
              <Link
                href="/login?next=/dashboard/services"
                className="mt-5 inline-flex rounded-full bg-purple-500 px-5 py-3 text-sm font-bold hover:bg-purple-400"
              >
                Log In
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="flex">
        <DashboardSidebar active="Services" />

        <section className="flex-1 p-6 lg:p-10">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
            <div>
              <p className="text-sm text-purple-300">Dashboard / Services</p>

              <h1 className="text-4xl font-black">Manage Services</h1>

              <p className="mt-2 max-w-3xl text-zinc-400">
                Add, edit, price, organize, and publish services to your public
                booking page. Upload a service photo or paste an image URL.
              </p>

              <p className="mt-3 text-sm text-zinc-500">
                Logged in as: {currentUser.email || "Account"}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={startNewService}
                className="rounded-full bg-purple-500 px-6 py-3 text-center font-bold hover:bg-purple-400"
              >
                Add New Service
              </button>

              {selectedBusiness && (
                <Link
                  href={`/${selectedBusiness.slug}`}
                  className="rounded-full border border-white/10 px-6 py-3 text-center font-bold hover:bg-white/10"
                >
                  View Booking Page
                </Link>
              )}

              <Link
                href="/dashboard"
                className="rounded-full border border-white/10 px-6 py-3 text-center font-bold hover:bg-white/10"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-zinc-300">Loading businesses...</p>
            </div>
          ) : businesses.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-yellow-400/30 bg-yellow-500/10 p-6">
              <h2 className="text-2xl font-bold text-yellow-200">
                No business found
              </h2>

              <p className="mt-2 text-sm text-zinc-300">
                Create a business profile before adding services.
              </p>

              <Link
                href="/signup/business"
                className="mt-5 inline-flex rounded-full bg-purple-500 px-5 py-3 text-sm font-bold hover:bg-purple-400"
              >
                Create Business
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <label className="text-sm font-semibold text-zinc-300">
                  Business
                </label>

                <select
                  value={selectedBusinessId}
                  onChange={(event) => setSelectedBusinessId(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none"
                >
                  {businesses.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.name} — /{business.slug}
                    </option>
                  ))}
                </select>

                {selectedBusiness && (
                  <p className="mt-3 text-sm text-purple-300">
                    Public page: appointeazebooking.com/{selectedBusiness.slug}
                  </p>
                )}
              </div>

              <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <section
                  ref={formRef}
                  className="rounded-3xl border border-purple-400/30 bg-purple-500/10 p-6 scroll-mt-6"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <h2 className="text-2xl font-black">
                        {editingServiceId ? "Edit Service" : "Add Service"}
                      </h2>

                      <p className="mt-1 text-sm text-zinc-300">
                        This service will show on the selected business booking
                        page when active.
                      </p>
                    </div>

                    {editingServiceId && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="rounded-full border border-white/10 px-5 py-3 text-sm font-bold hover:bg-white/10"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>

                  <div className="mt-6 grid gap-5">
                    <Field
                      label="Service name"
                      value={form.name}
                      placeholder="Haircut + Beard Trim"
                      onChange={(value) => updateForm("name", value)}
                    />

                    <div className="grid gap-5 md:grid-cols-3">
                      <Field
                        label="Category"
                        value={form.category}
                        placeholder="Hair"
                        onChange={(value) => updateForm("category", value)}
                      />

                      <Field
                        label="Price"
                        value={form.price}
                        placeholder="$45"
                        onChange={(value) => updateForm("price", value)}
                      />

                      <Field
                        label="Duration"
                        value={form.duration}
                        placeholder="45 minutes"
                        onChange={(value) => updateForm("duration", value)}
                      />
                    </div>

                    <Textarea
                      label="Description"
                      value={form.description}
                      placeholder="Describe what is included in this service."
                      onChange={(value) => updateForm("description", value)}
                    />

                    <div className="rounded-2xl border border-white/10 bg-black p-4">
                      <label className="text-sm font-semibold text-zinc-300">
                        Service photo
                      </label>

                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          const file = event.target.files?.[0];

                          if (file) {
                            uploadServicePhoto(file);
                          }
                        }}
                        className="mt-3 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none file:mr-4 file:rounded-full file:border-0 file:bg-purple-500 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white"
                      />

                      {uploadingPhoto && (
                        <p className="mt-2 text-sm text-purple-300">
                          Uploading photo...
                        </p>
                      )}

                      <p className="mt-4 text-xs text-zinc-500">
                        Or paste an image URL below.
                      </p>

                      <input
                        value={form.photo_url}
                        onChange={(event) =>
                          updateForm("photo_url", event.target.value)
                        }
                        placeholder="https://example.com/service-photo.jpg"
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none placeholder:text-zinc-600"
                      />
                    </div>

                    {form.photo_url && (
                      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
                        <img
                          src={form.photo_url}
                          alt="Service preview"
                          className="h-48 w-full object-cover"
                        />
                      </div>
                    )}

                    <div className="rounded-2xl border border-white/10 bg-black p-4">
                      <label className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-bold">Active on booking page</p>
                          <p className="mt-1 text-sm text-zinc-500">
                            Turn this off to hide the service without deleting
                            it.
                          </p>
                        </div>

                        <input
                          type="checkbox"
                          checked={form.active}
                          onChange={(event) =>
                            updateForm("active", event.target.checked)
                          }
                          className="h-5 w-5"
                        />
                      </label>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black p-4">
                      <p className="font-bold">Payment options</p>

                      <div className="mt-4 grid gap-3">
                        {paymentOptions.map((option) => (
                          <label
                            key={option}
                            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={form.payment_options.includes(option)}
                              onChange={() => togglePaymentOption(option)}
                            />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <Field
                        label="Deposit amount"
                        value={form.deposit_amount}
                        placeholder="$25"
                        onChange={(value) => updateForm("deposit_amount", value)}
                      />

                      <Field
                        label="Full payment amount"
                        value={form.full_payment_amount}
                        placeholder="$100"
                        onChange={(value) =>
                          updateForm("full_payment_amount", value)
                        }
                      />

                      <Field
                        label="Deposit due"
                        value={form.deposit_due}
                        placeholder="Immediately at booking"
                        onChange={(value) => updateForm("deposit_due", value)}
                      />

                      <Field
                        label="Deposit refund status"
                        value={form.deposit_refund_status}
                        placeholder="Non-refundable"
                        onChange={(value) =>
                          updateForm("deposit_refund_status", value)
                        }
                      />
                    </div>

                    <Field
                      label="Custom payment link"
                      value={form.custom_payment_link}
                      placeholder="https://..."
                      onChange={(value) =>
                        updateForm("custom_payment_link", value)
                      }
                    />

                    <Textarea
                      label="Payment instructions"
                      value={form.payment_instructions}
                      placeholder="Example: Deposit is required to hold your appointment."
                      onChange={(value) =>
                        updateForm("payment_instructions", value)
                      }
                    />

                    <div className="grid gap-5 md:grid-cols-2">
                      <Field
                        label="Cancellation deadline"
                        value={form.cancellation_deadline}
                        placeholder="24 hours before appointment"
                        onChange={(value) =>
                          updateForm("cancellation_deadline", value)
                        }
                      />

                      <Field
                        label="Reschedule deadline"
                        value={form.reschedule_deadline}
                        placeholder="24 hours before appointment"
                        onChange={(value) =>
                          updateForm("reschedule_deadline", value)
                        }
                      />
                    </div>

                    <Textarea
                      label="Cancellation policy text"
                      value={form.cancellation_policy_text}
                      placeholder="Example: Cancellations inside 24 hours may lose deposit."
                      onChange={(value) =>
                        updateForm("cancellation_policy_text", value)
                      }
                    />

                    <Textarea
                      label="Reschedule policy text"
                      value={form.reschedule_policy_text}
                      placeholder="Example: Reschedules must be requested at least 24 hours before appointment."
                      onChange={(value) =>
                        updateForm("reschedule_policy_text", value)
                      }
                    />

                    <div className="rounded-2xl border border-white/10 bg-black p-4">
                      <label className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-bold">Allow rescheduling</p>
                          <p className="mt-1 text-sm text-zinc-500">
                            Customers may request a reschedule based on your
                            policy.
                          </p>
                        </div>

                        <input
                          type="checkbox"
                          checked={form.allow_reschedule}
                          onChange={(event) =>
                            updateForm("allow_reschedule", event.target.checked)
                          }
                          className="h-5 w-5"
                        />
                      </label>
                    </div>

                    <Textarea
                      label="Customer instructions"
                      value={form.customer_instructions}
                      placeholder="Example: Please arrive 10 minutes early."
                      onChange={(value) =>
                        updateForm("customer_instructions", value)
                      }
                    />

                    <div className="rounded-2xl border border-white/10 bg-black p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-bold">Add-ons / sub-services</p>
                          <p className="mt-1 text-sm text-zinc-500">
                            Example: Beard trim $15, Design $20, Extra hour $50.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={addAddOnRow}
                          className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold hover:bg-white/10"
                        >
                          Add Row
                        </button>
                      </div>

                      <div className="mt-4 space-y-3">
                        {form.addOns.length > 0 ? (
                          form.addOns.map((addon, index) => (
                            <div
                              key={index}
                              className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 md:grid-cols-[1fr_140px_auto]"
                            >
                              <input
                                value={addon.name}
                                onChange={(event) =>
                                  updateAddOn(index, "name", event.target.value)
                                }
                                placeholder="Add-on name"
                                className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none placeholder:text-zinc-600"
                              />

                              <input
                                value={addon.price || ""}
                                onChange={(event) =>
                                  updateAddOn(index, "price", event.target.value)
                                }
                                placeholder="$15"
                                className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none placeholder:text-zinc-600"
                              />

                              <button
                                type="button"
                                onClick={() => removeAddOn(index)}
                                className="rounded-xl border border-red-400/30 px-4 py-3 text-sm font-bold text-red-300 hover:bg-red-500/10"
                              >
                                Remove
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-zinc-500">
                            No add-ons added yet.
                          </p>
                        )}
                      </div>
                    </div>

                    {message && (
                      <p className="rounded-xl border border-green-400/30 bg-green-500/10 p-4 text-sm font-semibold text-green-200">
                        {message}
                      </p>
                    )}

                    {error && (
                      <p className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-semibold text-red-200">
                        {error}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={saveService}
                      disabled={saving || uploadingPhoto}
                      className="rounded-xl bg-purple-500 py-4 text-lg font-black hover:bg-purple-400 disabled:opacity-60"
                    >
                      {saving
                        ? "Saving..."
                        : editingServiceId
                        ? "Save Service Changes"
                        : "Add Service"}
                    </button>
                  </div>
                </section>

                <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <h2 className="text-2xl font-black">Current Services</h2>

                      <p className="mt-1 text-sm text-zinc-400">
                        These services appear on the selected business booking
                        page when active.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        selectedBusiness && loadServices(selectedBusiness.id)
                      }
                      className="rounded-full border border-white/10 px-5 py-3 text-sm font-bold hover:bg-white/10"
                    >
                      Refresh
                    </button>
                  </div>

                  <div className="mt-6 space-y-4">
                    {servicesLoading ? (
                      <div className="rounded-2xl border border-white/10 bg-black p-5">
                        <p className="text-zinc-400">Loading services...</p>
                      </div>
                    ) : services.length > 0 ? (
                      services.map((service) => (
                        <div
                          key={service.id}
                          className="rounded-2xl border border-white/10 bg-black p-5"
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex gap-4">
                              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-purple-500/10 text-xs text-purple-200">
                                {service.photo_url ? (
                                  <img
                                    src={service.photo_url}
                                    alt={service.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  "Photo"
                                )}
                              </div>

                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-xl font-bold">
                                    {service.name}
                                  </h3>

                                  <span
                                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                                      service.active ?? true
                                        ? "bg-green-500/15 text-green-300"
                                        : "bg-zinc-500/15 text-zinc-300"
                                    }`}
                                  >
                                    {service.active ?? true
                                      ? "Active"
                                      : "Hidden"}
                                  </span>
                                </div>

                                <p className="mt-1 text-sm text-zinc-400">
                                  {service.category || "No category"} •{" "}
                                  {service.duration || "No duration"} •{" "}
                                  {service.price}
                                </p>

                                {service.description && (
                                  <p className="mt-2 text-sm text-zinc-500">
                                    {service.description}
                                  </p>
                                )}

                                <p className="mt-2 text-sm text-purple-300">
                                  {getPaymentSummary(service)}
                                </p>

                                {service.service_addons &&
                                  service.service_addons.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {service.service_addons.map((addon) => (
                                        <span
                                          key={addon.id || addon.name}
                                          className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300"
                                        >
                                          {addon.name} {addon.price || ""}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 lg:justify-end">
                              <button
                                type="button"
                                onClick={() => editService(service)}
                                className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold hover:bg-white/10"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => toggleActive(service)}
                                className="rounded-full border border-yellow-400/30 px-4 py-2 text-sm font-bold text-yellow-300 hover:bg-yellow-500/10"
                              >
                                {(service.active ?? true) ? "Hide" : "Show"}
                              </button>

                              <button
                                type="button"
                                onClick={() => deleteService(service.id)}
                                className="rounded-full border border-red-400/30 px-4 py-2 text-sm font-bold text-red-300 hover:bg-red-500/10"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-black p-6">
                        <h3 className="text-xl font-bold">No services yet</h3>
                        <p className="mt-2 text-sm text-zinc-400">
                          Add your first service using the form on this page.
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
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

function Textarea({
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

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none placeholder:text-zinc-600"
      />
    </div>
  );
}

function getPaymentSummary(service: Service) {
  const options = service.payment_options || [];

  if (options.includes("Deposit required")) {
    return service.deposit_amount
      ? `${service.deposit_amount} deposit required`
      : "Deposit required";
  }

  if (options.includes("Pay ahead in full")) {
    return service.full_payment_amount
      ? `${service.full_payment_amount} full payment available`
      : "Full payment available";
  }

  if (options.includes("Pay in person")) {
    return "Pay in person";
  }

  if (options.includes("Custom payment link — manual tracking")) {
    return "Custom payment link";
  }

  if (options.includes("Cash deposit allowed — manual tracking")) {
    return "Cash deposit allowed";
  }

  return options[0] || "Payment details set by business";
}