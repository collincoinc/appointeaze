"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
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
  team_login_limit: number | null;
};

type TeamMember = {
  id?: string;
  business_id?: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  bio: string;
  photo_url: string;
  can_login: boolean;
  can_manage_schedule: boolean;
  can_view_assigned_appointments: boolean;
  show_on_booking_page: boolean;
  accepting_bookings: boolean;
  created_at?: string;
};

function blankTeamMember(): TeamMember {
  return {
    name: "",
    role: "",
    email: "",
    phone: "",
    bio: "",
    photo_url: "",
    can_login: true,
    can_manage_schedule: true,
    can_view_assigned_appointments: true,
    show_on_booking_page: true,
    accepting_bookings: true,
  };
}

export default function TeamPage() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [checkingUser, setCheckingUser] = useState(true);

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const [loading, setLoading] = useState(true);
  const [teamLoading, setTeamLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TeamMember>(blankTeamMember());

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const panelRef = useRef<HTMLDivElement | null>(null);

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
      loadTeamMembers(selectedBusinessId);
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
      .select("id, name, slug, team_login_limit")
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
      setTeamMembers([]);
    }

    setLoading(false);
  }

  async function loadTeamMembers(businessId: string) {
    setTeamLoading(true);
    setError("");

    const { data: teamData, error: teamError } = await supabase
      .from("team_members")
      .select(
        "id, business_id, name, role, email, phone, bio, photo_url, can_login, can_manage_schedule, can_view_assigned_appointments, show_on_booking_page, accepting_bookings, created_at"
      )
      .eq("business_id", businessId)
      .order("created_at", { ascending: true });

    if (teamError) {
      console.error("Team load error:", teamError);
      setError(teamError.message || "Could not load team members.");
      setTeamMembers([]);
      setTeamLoading(false);
      return;
    }

    const mappedTeam = (teamData || []).map((person: any) => ({
      id: person.id,
      business_id: person.business_id,
      name: person.name || "",
      role: person.role || "",
      email: person.email || "",
      phone: person.phone || "",
      bio: person.bio || "",
      photo_url: person.photo_url || "",
      can_login: person.can_login ?? true,
      can_manage_schedule: person.can_manage_schedule ?? true,
      can_view_assigned_appointments:
        person.can_view_assigned_appointments ?? true,
      show_on_booking_page: person.show_on_booking_page ?? true,
      accepting_bookings: person.accepting_bookings ?? true,
      created_at: person.created_at,
    }));

    setTeamMembers(mappedTeam);
    setTeamLoading(false);
  }

  function scrollToPanel() {
    setTimeout(() => {
      panelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }

  function openAddPanel() {
    setDraft(blankTeamMember());
    setEditingId(null);
    setPanelOpen(true);
    setMessage("");
    setError("");
    scrollToPanel();
  }

  function openEditPanel(person: TeamMember) {
    setDraft({
      id: person.id,
      business_id: person.business_id,
      name: person.name || "",
      role: person.role || "",
      email: person.email || "",
      phone: person.phone || "",
      bio: person.bio || "",
      photo_url: person.photo_url || "",
      can_login: person.can_login ?? true,
      can_manage_schedule: person.can_manage_schedule ?? true,
      can_view_assigned_appointments:
        person.can_view_assigned_appointments ?? true,
      show_on_booking_page: person.show_on_booking_page ?? true,
      accepting_bookings: person.accepting_bookings ?? true,
      created_at: person.created_at,
    });

    setEditingId(person.id || null);
    setPanelOpen(true);
    setMessage("");
    setError("");
    scrollToPanel();
  }

  function closePanel() {
    setDraft(blankTeamMember());
    setEditingId(null);
    setPanelOpen(false);
    setMessage("");
    setError("");
  }

  function updateDraft<K extends keyof TeamMember>(
    key: K,
    value: TeamMember[K]
  ) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function uploadTeamPhoto(file: File) {
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
      .from("team-photos")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Team photo upload error:", uploadError);
      setError(uploadError.message || "Could not upload team photo.");
      setUploadingPhoto(false);
      return;
    }

    const { data } = supabase.storage
      .from("team-photos")
      .getPublicUrl(fileName);

    updateDraft("photo_url", data.publicUrl);
    setUploadingPhoto(false);
    setMessage("Photo uploaded. Save the team member to keep it.");
  }

  async function saveTeamMember() {
    setError("");
    setMessage("");

    if (!selectedBusiness) {
      setError("Please choose a business first.");
      return;
    }

    if (!draft.name.trim()) {
      setError("Team member name is required.");
      return;
    }

    setSaving(true);

    const teamPayload = {
      business_id: selectedBusiness.id,
      name: draft.name.trim(),
      role: draft.role.trim() || null,
      email: draft.email.trim() || null,
      phone: draft.phone.trim() || null,
      bio: draft.bio.trim() || null,
      photo_url: draft.photo_url.trim() || null,
      can_login: draft.can_login,
      can_manage_schedule: draft.can_manage_schedule,
      can_view_assigned_appointments: draft.can_view_assigned_appointments,
      show_on_booking_page: draft.show_on_booking_page,
      accepting_bookings: draft.accepting_bookings,
    };

    if (editingId) {
      const { error: updateError } = await supabase
        .from("team_members")
        .update(teamPayload)
        .eq("id", editingId)
        .eq("business_id", selectedBusiness.id);

      if (updateError) {
        console.error("Team update error:", updateError);
        setError(updateError.message || "Could not update team member.");
        setSaving(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase
        .from("team_members")
        .insert(teamPayload);

      if (insertError) {
        console.error("Team create error:", insertError);
        setError(insertError.message || "Could not create team member.");
        setSaving(false);
        return;
      }
    }

    await loadTeamMembers(selectedBusiness.id);
    setMessage(editingId ? "Team member updated." : "Team member created.");
    setSaving(false);
    closePanel();
  }

  async function deleteTeamMember(person: TeamMember) {
    if (!person.id || !selectedBusiness) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${person.name}? Existing appointments may keep showing Any Available instead.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(person.id);
    setError("");
    setMessage("");

    await supabase
      .from("service_team_members")
      .delete()
      .eq("team_member_id", person.id);

    const { error: deleteError } = await supabase
      .from("team_members")
      .delete()
      .eq("id", person.id)
      .eq("business_id", selectedBusiness.id);

    if (deleteError) {
      console.error("Team delete error:", deleteError);
      setError(deleteError.message || "Could not delete team member.");
      setDeletingId(null);
      return;
    }

    await loadTeamMembers(selectedBusiness.id);
    setMessage("Team member deleted.");
    setDeletingId(null);
  }

  async function toggleAcceptingBookings(person: TeamMember) {
    if (!person.id || !selectedBusiness) {
      return;
    }

    setError("");
    setMessage("");

    const { error: updateError } = await supabase
      .from("team_members")
      .update({
        accepting_bookings: !person.accepting_bookings,
      })
      .eq("id", person.id)
      .eq("business_id", selectedBusiness.id);

    if (updateError) {
      console.error("Accepting bookings update error:", updateError);
      setError(updateError.message || "Could not update booking status.");
      return;
    }

    await loadTeamMembers(selectedBusiness.id);
  }

  async function toggleShowOnBookingPage(person: TeamMember) {
    if (!person.id || !selectedBusiness) {
      return;
    }

    setError("");
    setMessage("");

    const { error: updateError } = await supabase
      .from("team_members")
      .update({
        show_on_booking_page: !person.show_on_booking_page,
      })
      .eq("id", person.id)
      .eq("business_id", selectedBusiness.id);

    if (updateError) {
      console.error("Booking page visibility update error:", updateError);
      setError(updateError.message || "Could not update visibility.");
      return;
    }

    await loadTeamMembers(selectedBusiness.id);
  }

  const visibleTeamMembers = teamMembers.filter(
    (person) => person.show_on_booking_page
  );

  const acceptingTeamMembers = teamMembers.filter(
    (person) => person.accepting_bookings
  );

  const loginEnabledTeamMembers = teamMembers.filter(
    (person) => person.can_login
  );

  const teamLimit = selectedBusiness?.team_login_limit ?? 5;

  if (checkingUser) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="flex">
          <DashboardSidebar active="Team Members" />

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
          <DashboardSidebar active="Team Members" />

          <section className="flex-1 p-6 lg:p-10">
            <div className="rounded-3xl border border-yellow-400/30 bg-yellow-500/10 p-6">
              <h1 className="text-3xl font-black text-yellow-200">
                Log in required
              </h1>

              <p className="mt-2 text-zinc-300">
                Please log in before managing team members.
              </p>

              <Link
                href="/login?next=/dashboard/team"
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
        <DashboardSidebar active="Team Members" />

        <section className="flex-1 p-6 lg:p-10">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm text-purple-300">Dashboard / Team</p>

              <h1 className="text-4xl font-black">Team Members</h1>

              <p className="mt-2 max-w-3xl text-zinc-400">
                Add staff, choose who appears on the booking page, control team
                login permissions, and decide who can accept appointments.
              </p>

              <p className="mt-3 text-sm text-zinc-500">
                Logged in as: {currentUser.email || "Account"}
              </p>
            </div>

            <button
              type="button"
              onClick={openAddPanel}
              className="rounded-full bg-purple-500 px-6 py-3 font-bold hover:bg-purple-400"
            >
              + Add Team Member
            </button>
          </div>

          {error && (
            <div className="mt-8 rounded-3xl border border-red-400/30 bg-red-500/10 p-6">
              <h2 className="text-2xl font-bold text-red-200">Team error</h2>
              <p className="mt-2 text-sm text-zinc-300">{error}</p>
            </div>
          )}

          {message && (
            <div className="mt-8 rounded-3xl border border-green-400/30 bg-green-500/10 p-6">
              <h2 className="text-2xl font-bold text-green-200">Success</h2>
              <p className="mt-2 text-sm text-zinc-300">{message}</p>
            </div>
          )}

          {loading && (
            <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-zinc-400">
                Loading your business and team members...
              </p>
            </div>
          )}

          {!loading && businesses.length === 0 && (
            <div className="mt-8 rounded-3xl border border-yellow-400/30 bg-yellow-500/10 p-6">
              <h2 className="text-2xl font-bold text-yellow-200">
                No business connected yet
              </h2>

              <p className="mt-2 text-sm text-zinc-300">
                Create a business profile before adding team members.
              </p>

              <Link
                href="/signup/business"
                className="mt-5 inline-flex rounded-full bg-purple-500 px-5 py-3 text-sm font-bold hover:bg-purple-400"
              >
                Create Business
              </Link>
            </div>
          )}

          {!loading && businesses.length > 0 && (
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

                {teamLoading && (
                  <p className="mt-3 text-sm text-zinc-500">
                    Refreshing team members...
                  </p>
                )}
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Total team" value={String(teamMembers.length)} />
                <StatCard
                  label="On booking page"
                  value={String(visibleTeamMembers.length)}
                />
                <StatCard
                  label="Accepting bookings"
                  value={String(acceptingTeamMembers.length)}
                />
                <StatCard
                  label="Team logins"
                  value={`${loginEnabledTeamMembers.length} / ${teamLimit}`}
                />
              </div>

              <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_380px]">
                <div className="space-y-5">
                  {teamMembers.length > 0 ? (
                    teamMembers.map((person) => (
                      <TeamMemberCard
                        key={person.id}
                        person={person}
                        deleting={deletingId === person.id}
                        onEdit={() => openEditPanel(person)}
                        onDelete={() => deleteTeamMember(person)}
                        onToggleAccepting={() =>
                          toggleAcceptingBookings(person)
                        }
                        onToggleVisible={() => toggleShowOnBookingPage(person)}
                      />
                    ))
                  ) : (
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                      <h2 className="text-2xl font-bold">
                        No team members yet
                      </h2>

                      <p className="mt-2 text-zinc-400">
                        Click + Add Team Member to create your first team
                        member. New accounts start empty and do not include demo
                        staff.
                      </p>

                      <button
                        type="button"
                        onClick={openAddPanel}
                        className="mt-5 rounded-full bg-purple-500 px-5 py-3 text-sm font-bold hover:bg-purple-400"
                      >
                        + Add Team Member
                      </button>
                    </div>
                  )}
                </div>

                {panelOpen ? (
                  <div
                    ref={panelRef}
                    className="rounded-3xl border border-purple-400/30 bg-purple-500/10 p-6 scroll-mt-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-bold">
                          {editingId ? "Edit Team Member" : "Add Team Member"}
                        </h2>

                        <p className="mt-2 text-sm text-zinc-300">
                          Team members saved here can appear on the public
                          booking page and can be assigned to appointments
                          later.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={closePanel}
                        className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
                      >
                        Close
                      </button>
                    </div>

                    <div className="mt-6 space-y-4">
                      <CardSection title="Basic Info">
                        <Field
                          label="Name"
                          value={draft.name}
                          placeholder="Example: Marcus Reed"
                          onChange={(value) => updateDraft("name", value)}
                        />

                        <Field
                          label="Role optional"
                          value={draft.role}
                          placeholder="Example: Master Barber"
                          onChange={(value) => updateDraft("role", value)}
                        />

                        <Field
                          label="Email optional"
                          value={draft.email}
                          placeholder="marcus@example.com"
                          onChange={(value) => updateDraft("email", value)}
                        />

                        <Field
                          label="Phone optional"
                          value={draft.phone}
                          placeholder="(555) 123-4567"
                          onChange={(value) => updateDraft("phone", value)}
                        />

                        <div>
                          <label className="text-sm font-semibold text-zinc-300">
                            Bio optional
                          </label>

                          <textarea
                            value={draft.bio}
                            onChange={(event) =>
                              updateDraft("bio", event.target.value)
                            }
                            placeholder="Short bio shown to customers later."
                            className="mt-2 h-24 w-full resize-none rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none placeholder:text-zinc-600"
                          />
                        </div>
                      </CardSection>

                      <CardSection title="Photo">
                        <div className="flex items-start gap-4">
                          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-purple-500/10 text-xs text-purple-200">
                            {draft.photo_url ? (
                              <img
                                src={draft.photo_url}
                                alt="Team preview"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              "Photo"
                            )}
                          </div>

                          <div className="flex-1">
                            <label className="text-sm font-semibold text-zinc-300">
                              Upload photo
                            </label>

                            <input
                              type="file"
                              accept="image/*"
                              onChange={(event) => {
                                const file = event.target.files?.[0];

                                if (file) {
                                  uploadTeamPhoto(file);
                                }
                              }}
                              className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none file:mr-4 file:rounded-full file:border-0 file:bg-purple-500 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white"
                            />

                            {uploadingPhoto && (
                              <p className="mt-2 text-sm text-purple-300">
                                Uploading photo...
                              </p>
                            )}

                            <p className="mt-4 text-xs text-zinc-500">
                              Or paste a photo URL below.
                            </p>

                            <input
                              value={draft.photo_url}
                              onChange={(event) =>
                                updateDraft("photo_url", event.target.value)
                              }
                              placeholder="https://..."
                              className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none placeholder:text-zinc-600"
                            />
                          </div>
                        </div>
                      </CardSection>

                      <CardSection title="Booking Page Visibility">
                        <Checkbox
                          label="Show this team member on booking page"
                          checked={draft.show_on_booking_page}
                          onChange={(checked) =>
                            updateDraft("show_on_booking_page", checked)
                          }
                        />

                        <Checkbox
                          label="Accepting customer bookings"
                          checked={draft.accepting_bookings}
                          onChange={(checked) =>
                            updateDraft("accepting_bookings", checked)
                          }
                        />
                      </CardSection>

                      <CardSection title="Team Login & Permissions">
                        <Checkbox
                          label="Can log into AppointEaze"
                          checked={draft.can_login}
                          onChange={(checked) =>
                            updateDraft("can_login", checked)
                          }
                        />

                        <Checkbox
                          label="Can manage their own schedule"
                          checked={draft.can_manage_schedule}
                          onChange={(checked) =>
                            updateDraft("can_manage_schedule", checked)
                          }
                        />

                        <Checkbox
                          label="Can view assigned appointments"
                          checked={draft.can_view_assigned_appointments}
                          onChange={(checked) =>
                            updateDraft(
                              "can_view_assigned_appointments",
                              checked
                            )
                          }
                        />
                      </CardSection>

                      <button
                        type="button"
                        onClick={saveTeamMember}
                        disabled={saving || uploadingPhoto}
                        className="w-full rounded-xl bg-purple-500 py-4 font-bold hover:bg-purple-400 disabled:opacity-60"
                      >
                        {saving
                          ? "Saving..."
                          : editingId
                          ? "Save Changes"
                          : "Save Team Member"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="rounded-3xl border border-purple-400/30 bg-purple-500/10 p-6">
                      <h2 className="text-2xl font-bold">Team Panel</h2>

                      <p className="mt-2 text-sm text-zinc-300">
                        Click + Add Team Member or Edit to manage staff details.
                      </p>

                      <button
                        type="button"
                        onClick={openAddPanel}
                        className="mt-6 w-full rounded-xl bg-purple-500 py-4 font-bold hover:bg-purple-400"
                      >
                        + Add Team Member
                      </button>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                      <h2 className="text-xl font-bold">Supabase Status</h2>

                      <p className="mt-2 text-sm text-zinc-400">
                        Team members loaded from your selected business:
                      </p>

                      <p className="mt-3 text-4xl font-black text-purple-300">
                        {teamMembers.length}
                      </p>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                      <h2 className="text-xl font-bold">Launch Team Limit</h2>

                      <p className="mt-2 text-sm text-zinc-400">
                        Flat $9.99/month launch pricing includes up to 5 team
                        members for now.
                      </p>

                      <div className="mt-5 rounded-2xl bg-black p-5">
                        <p className="text-sm text-zinc-500">Logins used</p>

                        <p className="mt-2 text-4xl font-black text-purple-300">
                          {loginEnabledTeamMembers.length} / {teamLimit}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                      <h2 className="text-xl font-bold">Team Rules</h2>

                      <div className="mt-4 space-y-3 text-sm text-zinc-300">
                        <p>✓ Show or hide staff on booking page</p>
                        <p>✓ Allow or pause bookings per person</p>
                        <p>✓ Team login permission</p>
                        <p>✓ Schedule management permission</p>
                        <p>✓ Assigned appointment visibility</p>
                        <p>Later: staff-specific availability</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function TeamMemberCard({
  person,
  deleting,
  onEdit,
  onDelete,
  onToggleAccepting,
  onToggleVisible,
}: {
  person: TeamMember;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleAccepting: () => void;
  onToggleVisible: () => void;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex flex-col gap-5 md:flex-row">
        <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-purple-500/10 text-sm text-purple-300">
          {person.photo_url ? (
            <img
              src={person.photo_url}
              alt={person.name}
              className="h-full w-full object-cover"
            />
          ) : (
            "Photo"
          )}
        </div>

        <div className="flex-1">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold">{person.name}</h2>

                <span
                  className={
                    person.accepting_bookings
                      ? "rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-300"
                      : "rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-300"
                  }
                >
                  {person.accepting_bookings ? "Accepting" : "Paused"}
                </span>

                <span
                  className={
                    person.show_on_booking_page
                      ? "rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-200"
                      : "rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-zinc-400"
                  }
                >
                  {person.show_on_booking_page
                    ? "Public"
                    : "Hidden from booking"}
                </span>
              </div>

              <p className="mt-1 text-zinc-400">
                {person.role || "No role added"}
              </p>

              {person.bio && (
                <p className="mt-3 max-w-2xl text-sm text-zinc-500">
                  {person.bio}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onEdit}
                className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              >
                Edit
              </button>

              <button
                type="button"
                onClick={onDelete}
                disabled={deleting}
                className="rounded-full border border-red-400/30 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <InfoBox label="Email" value={person.email || "Not added"} />
            <InfoBox label="Phone" value={person.phone || "Not added"} />
            <InfoBox
              label="Can login"
              value={person.can_login ? "Yes" : "No"}
            />
            <InfoBox
              label="Manage schedule"
              value={person.can_manage_schedule ? "Yes" : "No"}
            />
            <InfoBox
              label="View assigned appointments"
              value={person.can_view_assigned_appointments ? "Yes" : "No"}
            />
            <InfoBox
              label="Booking page"
              value={person.show_on_booking_page ? "Visible" : "Hidden"}
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onToggleAccepting}
              className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
            >
              {person.accepting_bookings
                ? "Pause Bookings"
                : "Resume Bookings"}
            </button>

            <button
              type="button"
              onClick={onToggleVisible}
              className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
            >
              {person.show_on_booking_page
                ? "Hide From Booking Page"
                : "Show On Booking Page"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-3 text-4xl font-black">{value}</p>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
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
    <label className="flex items-center justify-between rounded-xl border border-white/10 bg-black px-4 py-3 text-sm">
      <span>{label}</span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
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
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}