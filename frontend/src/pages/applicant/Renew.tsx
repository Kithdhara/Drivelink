import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { FEES, LICENSE_CATEGORIES } from '../../types';
import type { LicenseCategory } from '../../types';
import { formatMoney, isWithin12Hours, remainingEditHours, validateNIC, validatePhone, validateUpload } from '../../lib/utils';
import { Alert, Button, Card, Field, Input, PageHeader, Select, Spinner, scrollToFirstError } from '../../components/ui';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
  createRenewalAPI,
  getRenewalsByApplicantAPI,
  editRenewalAPI,
  cancelRenewalAPI,
  type BackendRenewal,
} from '../../lib/api';
import { useToast } from '../../components/Toast';
import { Clock, Edit3, FileText, History, Image, LifeBuoy, Stethoscope, Upload, X } from 'lucide-react';

export default function Renew() {
  const { user } = useAuth();
  const nav = useNavigate();
  const toast = useToast();

  // Existing renewals state
  const [renewals, setRenewals] = useState<BackendRenewal[]>([]);
  const [loadingRenewals, setLoadingRenewals] = useState(true);
  const [showCancelled, setShowCancelled] = useState(false);
  const [editingRenewal, setEditingRenewal] = useState<BackendRenewal | null>(null);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [editBusy, setEditBusy] = useState(false);

  // Edit modal form state
  const [editCategory, setEditCategory] = useState<LicenseCategory>('B');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editOneDay, setEditOneDay] = useState(false);

  // New renewal form state
  const [category, setCategory] = useState<LicenseCategory>('B');
  const [licenseNo, setLicenseNo] = useState('');
  const [fullName, setFullName] = useState(user?.name ?? '');
  const [nic, setNic] = useState(user?.nic ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [address, setAddress] = useState(user?.address ?? '');
  const [oneDay, setOneDay] = useState(false);

  // File uploads
  const [nicFile, setNicFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [medicalFile, setMedicalFile] = useState<File | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const nicInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const medicalInputRef = useRef<HTMLInputElement>(null);

  function handleFilePick(type: 'nic' | 'photo' | 'medical', file?: File) {
    if (!file) return;
    const v = validateUpload(file);
    if (v) {
      setFieldErrors((prev) => ({ ...prev, [type]: v }));
      return;
    }
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[type];
      return next;
    });

    if (type === 'nic') setNicFile(file);
    else if (type === 'photo') setPhotoFile(file);
    else if (type === 'medical') setMedicalFile(file);
  }

  // Fetch renewals on mount
  useEffect(() => {
    if (!user) return;
    getRenewalsByApplicantAPI(user.id)
      .then(setRenewals)
      .catch(() => [])
      .finally(() => setLoadingRenewals(false));
  }, [user]);

  function startEdit(r: BackendRenewal) {
    setEditingRenewal(r);
    setEditCategory((r.category as LicenseCategory) || 'B');
    setEditPhone(r.phone || '');
    setEditEmail(r.email || '');
    setEditAddress(r.address || '');
    setEditOneDay(r.oneDayService || false);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingRenewal) return;
    setEditBusy(true);
    try {
      const updated = await editRenewalAPI(editingRenewal.id, {
        category: editCategory,
        phone: editPhone.trim(),
        email: editEmail.trim(),
        address: editAddress.trim(),
        oneDayService: editOneDay,
      });
      setRenewals((prev) => prev.map((r) => (r.id === editingRenewal.id ? { ...r, ...updated } : r)));
      toast.success('Renewal request updated successfully.');
      setEditingRenewal(null);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to update renewal request');
    } finally {
      setEditBusy(false);
    }
  }

  async function handleCancelRenewal(id: string) {
    try {
      await cancelRenewalAPI(id);
      setRenewals((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'CANCELLED' } : r)));
      toast.success('Renewal request cancelled successfully.');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel renewal');
    } finally {
      setCancelConfirmId(null);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const errors: Record<string, string> = {};

    // 1. License Number validation: 1 capital alphabet + 7 numbers
    const cleanLic = licenseNo.trim().toUpperCase();
    if (!cleanLic) {
      errors.licenseNo = 'Enter your existing licence number.';
    } else if (!/^[A-Z]\d{7}$/.test(cleanLic)) {
      errors.licenseNo = 'Must be 1 capital letter followed by 7 digits (e.g. B1234567).';
    }

    // 2. Personal info validation
    if (!fullName.trim()) errors.fullName = 'Full name is required.';
    const nicErr = validateNIC(nic);
    if (nicErr) errors.nic = nicErr;
    const phoneErr = validatePhone(phone);
    if (phoneErr) errors.phone = phoneErr;

    // 3. Document files validation
    if (!nicFile) errors.nic = 'NIC copy document is required.';
    if (!photoFile) errors.photo = 'Passport-size photograph is required.';
    if (!medicalFile) errors.medical = 'Medical fitness report is required.';

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setErr('Please fix the errors indicated below before submitting.');
      scrollToFirstError();
      return;
    }

    setBusy(true);
    setErr('');
    try {
      const created = await createRenewalAPI({
        applicantId: user.id,
        licenseNumber: cleanLic,
        category,
        fullName: fullName.trim(),
        nic: nic.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        oneDayService: oneDay,
        nicCopy: nicFile ?? undefined,
        passportPhoto: photoFile ?? undefined,
        medicalReport: medicalFile ?? undefined,
      });
      toast.success('Renewal application submitted successfully with documents.');
      setRenewals((prev) => [created, ...prev]);
      setLicenseNo('');
      setNicFile(null);
      setPhotoFile(null);
      setMedicalFile(null);
      nav('/app');
    } catch (error: unknown) {
      setErr(error instanceof Error ? error.message : 'Submission failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        kicker="Existing holders"
        title="Renew a driving licence"
        subtitle="Submit your licence renewal application with required identification, photograph, and medical certificate."
      />

      {/* ── Your Existing Renewal Requests ── */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#0b1c33]/10 pb-3 mb-4">
          <div>
            <h2 className="font-display text-2xl text-[#0b1c33]">Your renewal requests</h2>
            <p className="text-xs text-[#0b1c33]/60">
              Manage your submitted licence renewal requests, review status, or modify details.
            </p>
          </div>
          {renewals.some((r) => r.status === 'CANCELLED') && (
            <button
              type="button"
              onClick={() => setShowCancelled(!showCancelled)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#0b1c33]/15 bg-white px-3 py-1.5 text-xs font-semibold text-[#0b1c33]/70 hover:bg-[#0b1c33]/5 transition"
            >
              <History className="h-3.5 w-3.5" />
              {showCancelled
                ? 'Hide cancelled history'
                : `Show cancelled history (${renewals.filter((r) => r.status === 'CANCELLED').length})`}
            </button>
          )}
        </div>

        {loadingRenewals ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : renewals.filter((r) => r.status !== 'CANCELLED').length === 0 ? (
          <p className="text-sm text-[#0b1c33]/50 italic mb-6">
            {renewals.some((r) => r.status === 'CANCELLED')
              ? 'No active renewal requests. (Cancelled records hidden in history above).'
              : 'No existing renewal requests on file. Use the form below to apply.'}
          </p>
        ) : (
          <div className="space-y-4 mb-8">
            {renewals
              .filter((r) => r.status !== 'CANCELLED')
              .map((r) => {
                const isPending = r.status === 'PENDING';
                const within12 = isWithin12Hours(r.createdAt);
                const hoursLeft = remainingEditHours(r.createdAt);

                return (
                  <Card key={r.id} className="border-l-4 border-l-[#c6a15b]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-lg font-bold text-[#0b1c33]">
                            Request #{r.id} · Licence: {r.licenseNumber}
                          </h3>
                          <span className="rounded bg-[#0b1c33]/10 px-2 py-0.5 text-xs font-semibold text-[#0b1c33]">
                            Class {r.category}
                          </span>
                          {r.oneDayService && (
                            <span className="rounded bg-[#c6a15b]/20 px-2 py-0.5 text-xs font-bold text-[#8c6b2d]">
                              One-Day Fast Track
                            </span>
                          )}
                        </div>

                        <div className="mt-2 grid gap-1 text-xs text-[#0b1c33]/70 sm:grid-cols-2">
                          <p><strong>Applicant:</strong> {r.fullName} (NIC: {r.nic})</p>
                          <p><strong>Contact:</strong> {r.phone || 'N/A'} · {r.email || 'N/A'}</p>
                          {r.address && <p className="sm:col-span-2"><strong>Address:</strong> {r.address}</p>}
                        </div>

                        {r.status === 'APPROVED' && (
                          <div className="mt-3 rounded-lg bg-green-50 border border-green-200 p-2.5 text-xs text-green-800">
                            🎉 <strong>Approved by Officer:</strong> Your renewal has been approved! {r.officerNotes ? `Notes: "${r.officerNotes}".` : ''} Please proceed to card issuance collection.
                          </div>
                        )}

                        {r.status === 'REJECTED' && (
                          <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-800">
                            ⚠️ <strong>Renewal Application Rejected:</strong> {r.rejectionReason || 'Requirements not met'}. {r.officerNotes ? `Officer notes: "${r.officerNotes}".` : ''} You may submit a corrected application below.
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            r.status === 'APPROVED'
                              ? 'bg-green-100 text-green-800'
                              : r.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {r.status}
                        </span>

                        {isPending && (
                          within12 ? (
                            <div className="flex gap-2">
                              <Button size="sm" variant="secondary" onClick={() => startEdit(r)}>
                                <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit
                              </Button>
                              <Button size="sm" variant="danger" onClick={() => setCancelConfirmId(r.id)}>
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-end gap-1">
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-500">
                                <Clock className="h-3 w-3" /> 12h window expired
                              </span>
                              <Link to="/app/tickets/new">
                                <Button size="sm" variant="secondary" className="text-xs">
                                  <LifeBuoy className="h-3.5 w-3.5 mr-1" /> Raise Ticket
                                </Button>
                              </Link>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {isPending && within12 && (
                      <p className="mt-3 border-t border-[#0b1c33]/8 pt-2 text-[11px] text-[#0e7c7b]">
                        ℹ️ Self-service edits and cancellation are permitted within 12 hours of submission ({hoursLeft}h remaining).
                      </p>
                    )}
                  </Card>
                );
              })}
          </div>
        )}

        {/* Cancelled renewals drawer */}
        {showCancelled && (
          <div className="mb-8 rounded-xl border border-dashed border-stone-300 bg-stone-50/70 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Cancelled Renewal Requests History
            </p>
            {renewals
              .filter((r) => r.status === 'CANCELLED')
              .map((r) => (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stone-200 bg-white p-3 text-sm opacity-80"
                >
                  <div>
                    <p className="font-medium text-stone-700">
                      Request #{r.id} · Licence: {r.licenseNumber} · Class {r.category}
                    </p>
                    <p className="text-xs text-stone-400">
                      Cancelled request retained for official audit trail
                    </p>
                  </div>
                  <span className="rounded bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-600">
                    CANCELLED
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="border-t border-[#0b1c33]/10 pt-6 mb-6">
        <h2 className="font-display text-2xl text-[#0b1c33]">Submit new renewal application</h2>
        <p className="text-xs text-[#0b1c33]/60">Complete the particulars and upload required documents below.</p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        {err && <Alert kind="error">{err}</Alert>}

        {/* ── Section 1: Existing Licence Details ── */}
        <Card>
          <div className="border-b border-[#0b1c33]/8 pb-3 mb-4">
            <h2 className="font-display text-xl text-[#0b1c33]">Licence details</h2>
            <p className="text-xs text-[#0b1c33]/55">Provide your current driving licence number and category to renew.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Existing licence number"
              required
              hint="Format: 1 capital alphabet and 7 numbers (e.g. B1234567)"
              error={fieldErrors.licenseNo}
            >
              <Input
                value={licenseNo}
                onChange={(e) => setLicenseNo(e.target.value.toUpperCase())}
                placeholder="B1234567"
                maxLength={8}
                className="uppercase font-mono tracking-wider"
              />
            </Field>

            <Field label="Class to renew" required>
              <Select value={category} onChange={(e) => setCategory(e.target.value as LicenseCategory)}>
                {LICENSE_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} — {c.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <label className="mt-5 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={oneDay} onChange={(e) => setOneDay(e.target.checked)} />
            <span>
              Request <strong>One-Day Priority Service</strong> (+{formatMoney(FEES.one_day)})
            </span>
          </label>
        </Card>

        {/* ── Section 2: Applicant Particulars ── */}
        <Card>
          <div className="border-b border-[#0b1c33]/8 pb-3 mb-4">
            <h2 className="font-display text-xl text-[#0b1c33]">Applicant information</h2>
            <p className="text-xs text-[#0b1c33]/55">Confirm or update your registered contact information.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" required error={fieldErrors.fullName}>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" />
            </Field>

            <Field label="National Identity Card (NIC)" required error={fieldErrors.nic}>
              <Input value={nic} onChange={(e) => setNic(e.target.value.toUpperCase())} placeholder="NIC number" />
            </Field>

            <Field label="Phone number" required error={fieldErrors.phone}>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXXXXXXX" />
            </Field>

            <Field label="Email address">
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Residential address">
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full street address" />
              </Field>
            </div>
          </div>
        </Card>

        {/* ── Section 3: Required Supporting Documents ── */}
        <Card>
          <div className="border-b border-[#0b1c33]/8 pb-3 mb-4">
            <h2 className="font-display text-xl text-[#0b1c33]">Required documents</h2>
            <p className="text-xs text-[#0b1c33]/55">
              Upload clear copies of your National Identity Card, passport photograph, and medical certificate (PDF, JPG, PNG up to 5MB).
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {/* 1. NIC Document */}
            <div className={`rounded-xl border p-4 text-center ${fieldErrors.nic ? 'border-red-400 bg-red-50/30' : 'border-[#0b1c33]/15 bg-[#fcfaf6]'}`}>
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#0e7c7b]/10 text-[#0e7c7b]">
                <FileText className="h-5 w-5" />
              </div>
              <p className="mt-2 text-sm font-semibold text-[#0b1c33]">NIC Copy *</p>
              <p className="text-xs text-[#0b1c33]/55">Front & back copy in PDF or Image</p>

              {nicFile ? (
                <div className="mt-3 flex items-center justify-between rounded-lg bg-white p-2 text-xs border border-green-200">
                  <span className="truncate font-medium text-green-800">{nicFile.name}</span>
                  <button type="button" onClick={() => setNicFile(null)} className="text-red-500 hover:text-red-700">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="mt-3">
                  <input
                    type="file"
                    ref={nicInputRef}
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    onChange={(e) => handleFilePick('nic', e.target.files?.[0])}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    onClick={() => nicInputRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5 mr-1" /> Choose file
                  </Button>
                </div>
              )}
              {fieldErrors.nic && <p className="mt-1 text-xs text-red-600">{fieldErrors.nic}</p>}
            </div>

            {/* 2. Passport Photograph */}
            <div className={`rounded-xl border p-4 text-center ${fieldErrors.photo ? 'border-red-400 bg-red-50/30' : 'border-[#0b1c33]/15 bg-[#fcfaf6]'}`}>
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#c6a15b]/20 text-[#c6a15b]">
                <Image className="h-5 w-5" />
              </div>
              <p className="mt-2 text-sm font-semibold text-[#0b1c33]">Passport Photograph *</p>
              <p className="text-xs text-[#0b1c33]/55">Recent colour photo, white background</p>

              {photoFile ? (
                <div className="mt-3 flex items-center justify-between rounded-lg bg-white p-2 text-xs border border-green-200">
                  <span className="truncate font-medium text-green-800">{photoFile.name}</span>
                  <button type="button" onClick={() => setPhotoFile(null)} className="text-red-500 hover:text-red-700">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="mt-3">
                  <input
                    type="file"
                    ref={photoInputRef}
                    className="hidden"
                    accept=".png,.jpg,.jpeg,.webp"
                    onChange={(e) => handleFilePick('photo', e.target.files?.[0])}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    onClick={() => photoInputRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5 mr-1" /> Choose file
                  </Button>
                </div>
              )}
              {fieldErrors.photo && <p className="mt-1 text-xs text-red-600">{fieldErrors.photo}</p>}
            </div>

            {/* 3. Medical Certificate */}
            <div className={`rounded-xl border p-4 text-center ${fieldErrors.medical ? 'border-red-400 bg-red-50/30' : 'border-[#0b1c33]/15 bg-[#fcfaf6]'}`}>
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#0e7c7b]/10 text-[#0e7c7b]">
                <Stethoscope className="h-5 w-5" />
              </div>
              <p className="mt-2 text-sm font-semibold text-[#0b1c33]">Medical Certificate *</p>
              <p className="text-xs text-[#0b1c33]/55">Government fitness certificate (NTMI)</p>

              {medicalFile ? (
                <div className="mt-3 flex items-center justify-between rounded-lg bg-white p-2 text-xs border border-green-200">
                  <span className="truncate font-medium text-green-800">{medicalFile.name}</span>
                  <button type="button" onClick={() => setMedicalFile(null)} className="text-red-500 hover:text-red-700">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="mt-3">
                  <input
                    type="file"
                    ref={medicalInputRef}
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    onChange={(e) => handleFilePick('medical', e.target.files?.[0])}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    onClick={() => medicalInputRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5 mr-1" /> Choose file
                  </Button>
                </div>
              )}
              {fieldErrors.medical && <p className="mt-1 text-xs text-red-600">{fieldErrors.medical}</p>}
            </div>
          </div>
        </Card>

        {/* ── Section 4: Fees & Submission ── */}
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs text-[#0b1c33]/55 uppercase tracking-wide">Total Fee Payable</p>
              <p className="text-2xl font-bold text-[#0b1c33]">
                {formatMoney(FEES.renewal + (oneDay ? FEES.one_day : 0))}
              </p>
              <p className="mt-1 text-xs text-[#0b1c33]/55">
                Includes statutory renewal fee {formatMoney(FEES.renewal)}
                {oneDay ? ` + One-Day fast-track processing ${formatMoney(FEES.one_day)}` : ''}.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button type="button" variant="ghost" onClick={() => nav('/app')}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy} variant="gold" size="lg">
                {busy && <Spinner />}
                Submit Renewal Application
              </Button>
            </div>
          </div>
          <p className="mt-4 border-t border-[#0b1c33]/8 pt-3 text-[11px] text-[#0b1c33]/50">
            ℹ️ You can edit or withdraw this renewal request within 12 hours of submission. Once reviewed by the officer or after 12 hours, records are locked.
          </p>
        </Card>
      </form>

      {/* ── Inline Edit Modal for Pending Renewal ── */}
      {editingRenewal && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditingRenewal(null)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#0b1c33]/10 pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-[#0b1c33]">
                  Edit Renewal #{editingRenewal.id}
                </h3>
                <p className="text-xs text-[#0b1c33]/60">
                  Licence: {editingRenewal.licenseNumber} · Applicant: {editingRenewal.fullName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingRenewal(null)}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              <Field label="Class to renew" required>
                <Select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as LicenseCategory)}
                >
                  {LICENSE_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} — {c.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Phone number" required>
                <Input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="07XXXXXXXX"
                />
              </Field>

              <Field label="Email address">
                <Input
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="Email"
                />
              </Field>

              <Field label="Residential address">
                <Input
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Full street address"
                />
              </Field>

              <label className="flex items-center gap-2 text-sm pt-1">
                <input
                  type="checkbox"
                  checked={editOneDay}
                  onChange={(e) => setEditOneDay(e.target.checked)}
                />
                <span>
                  Request <strong>One-Day Priority Service</strong> (+{formatMoney(FEES.one_day)})
                </span>
              </label>

              <div className="mt-6 flex justify-end gap-3 border-t border-stone-100 pt-4">
                <Button type="button" variant="ghost" onClick={() => setEditingRenewal(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="gold" disabled={editBusy}>
                  {editBusy ? <Spinner /> : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Cancel Confirmation Dialog ── */}
      <ConfirmDialog
        open={!!cancelConfirmId}
        title="Cancel renewal request?"
        message="Are you sure you want to cancel this renewal request? The record will be safely retained in your history for official audit compliance."
        confirmLabel="Yes, cancel request"
        variant="danger"
        onConfirm={() => cancelConfirmId && handleCancelRenewal(cancelConfirmId)}
        onCancel={() => setCancelConfirmId(null)}
      />
    </div>
  );
}
