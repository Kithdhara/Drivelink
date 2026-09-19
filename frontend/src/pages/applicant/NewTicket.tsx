import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { Alert, Button, Card, Field, Input, PageHeader, Select, Spinner, Textarea } from '../../components/ui';
import { useToast } from '../../components/Toast';
import {
  createTicketAPI,
  getApplicationsByApplicantAPI,
  type BackendApplication,
} from '../../lib/api';

export default function NewTicket() {
  const { user } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();

  const preselectedAppId = searchParams.get('appId');

  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<BackendApplication[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);

  // Form fields for corrections
  const [reason, setReason] = useState('');
  const [fullName, setFullName] = useState('');
  const [nic, setNic] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  // Proof files
  const [nicFile, setNicFile] = useState<File | null>(null);
  const [birthCertFile, setBirthCertFile] = useState<File | null>(null);
  const [additionalFile, setAdditionalFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!user) return;
    getApplicationsByApplicantAPI(user.id)
      .then((data) => {
        setApps(data);
        if (data.length > 0) {
          const match = preselectedAppId
            ? data.find((a) => a.id === Number(preselectedAppId))
            : data[0];
          const initial = match || data[0];
          setSelectedAppId(initial.id);
          populateFields(initial);
        }
      })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [user, preselectedAppId]);

  function populateFields(app: BackendApplication) {
    setFullName(app.fullName || '');
    setNic(app.nic || '');
    setDob(app.dateOfBirth ? app.dateOfBirth.slice(0, 10) : '');
    setGender(app.gender || '');
    setAddress(app.address || '');
    setPhone(app.phone || '');
    setEmail(app.email || '');
    setBloodGroup(app.bloodGroup || '');
    setEmergencyContact(app.emergencyContact || '');
  }

  const selectedApp = apps.find((a) => a.id === selectedAppId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !selectedAppId || !selectedApp) return;

    if (!reason.trim()) {
      setErr('Please state the reason for requesting this profile correction.');
      return;
    }

    setSubmitting(true);
    setErr('');

    try {
      const fd = new FormData();
      fd.append('applicationId', String(selectedAppId));
      fd.append('applicantId', user.id);
      fd.append('applicantName', user.name || user.email);
      fd.append('applicantEmail', user.email);
      fd.append('reason', reason.trim());

      // Only append fields if they differ from current locked app or are provided
      if (fullName && fullName !== selectedApp.fullName) fd.append('requestedFullName', fullName.trim());
      if (nic && nic !== selectedApp.nic) fd.append('requestedNic', nic.trim());
      if (dob && dob !== (selectedApp.dateOfBirth ? selectedApp.dateOfBirth.slice(0, 10) : '')) {
        fd.append('requestedDateOfBirth', dob);
      }
      if (gender && gender !== selectedApp.gender) fd.append('requestedGender', gender);
      if (address && address !== selectedApp.address) fd.append('requestedAddress', address.trim());
      if (phone && phone !== selectedApp.phone) fd.append('requestedPhone', phone.trim());
      if (email && email !== selectedApp.email) fd.append('requestedEmail', email.trim());
      if (bloodGroup && bloodGroup !== selectedApp.bloodGroup) fd.append('requestedBloodGroup', bloodGroup);
      if (emergencyContact && emergencyContact !== selectedApp.emergencyContact) {
        fd.append('requestedEmergencyContact', emergencyContact.trim());
      }

      // Files
      if (nicFile) fd.append('nicCopy', nicFile);
      if (birthCertFile) fd.append('birthCertificate', birthCertFile);
      if (additionalFile) fd.append('additionalDoc', additionalFile);

      const ticket = await createTicketAPI(fd);
      toast.success(`Ticket ${ticket.ticketNumber} raised successfully.`);
      nav('/app/tickets');
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to create support ticket');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner /></div>;

  if (apps.length === 0) {
    return (
      <div>
        <PageHeader kicker="Support" title="Raise Correction Ticket" />
        <Alert kind="warning" title="No Applications Found">
          You do not have any submitted licence applications to request corrections for.
          <div className="mt-3">
            <Button variant="gold" onClick={() => nav('/app/apply')}>
              Apply for Licence →
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <PageHeader
        kicker="Administrative Support"
        title="Post-12-Hour Profile Correction Ticket"
        subtitle="Submit official evidence to request administrative override and record recreation for locked applications."
      />

      {err && (
        <div className="mt-4">
          <Alert kind="error">{err}</Alert>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-amber-600/30 bg-amber-500/10 p-4 text-sm text-[#0b1c33]">
        <p className="font-semibold text-amber-900">Official Process Notice</p>
        <p className="mt-1 text-xs text-[#0b1c33]/80">
          Under DMT regulatory policy, applicant profile data is locked 12 hours post-submission.
          To correct verified legal information (such as National Identity Card number, legal name, or date of birth),
          a <strong>Registration Officer</strong> will review your submitted proof documents and perform an administrative atomic recreation of your application while preserving all examination and trial appointments.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Application Selector */}
        <Card>
          <Field label="Select Target Application" required hint="Choose the application requiring profile correction">
            <Select
              value={selectedAppId || ''}
              onChange={(e) => {
                const id = Number(e.target.value);
                setSelectedAppId(id);
                const found = apps.find((a) => a.id === id);
                if (found) populateFields(found);
              }}
            >
              {apps.map((a) => (
                <option key={a.id} value={a.id}>
                  Application #{a.id} · {a.fullName} · {a.nic} · Status: {a.status} (Submitted {new Date(a.submittedAt).toLocaleDateString()})
                </option>
              ))}
            </Select>
          </Field>
        </Card>

        {/* Reason for Correction */}
        <Card>
          <h3 className="font-display text-lg font-bold text-[#0b1c33]">1. Reason for Correction</h3>
          <p className="text-xs text-[#0b1c33]/60 mb-3">Explain clearly why this change is needed and reference your attached proof documents.</p>
          <Field label="Justification & Officer Notes" required>
            <Textarea
              rows={3}
              placeholder="e.g., My NIC number was typed incorrectly during initial registration (missing last digit). Please find attached my scanned National Identity Card for administrative verification."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </Field>
        </Card>

        {/* Requested Corrected Fields */}
        <Card>
          <h3 className="font-display text-lg font-bold text-[#0b1c33]">2. Corrected Profile Details</h3>
          <p className="text-xs text-[#0b1c33]/60 mb-4">Edit the fields below that need to be updated. Leave unchanged fields as they are.</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full Legal Name" hint={selectedApp?.fullName !== fullName ? '✏️ Modified' : ''}>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </Field>

            <Field label="NIC / Passport Number" hint={selectedApp?.nic !== nic ? '✏️ Modified' : ''}>
              <Input value={nic} onChange={(e) => setNic(e.target.value)} />
            </Field>

            <Field label="Date of Birth" hint={selectedApp?.dateOfBirth?.slice(0, 10) !== dob ? '✏️ Modified' : ''}>
              <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
            </Field>

            <Field label="Gender">
              <Select value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
            </Field>

            <Field label="Contact Phone Number" hint={selectedApp?.phone !== phone ? '✏️ Modified' : ''}>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>

            <Field label="Email Address" hint={selectedApp?.email !== email ? '✏️ Modified' : ''}>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>

            <Field label="Blood Group">
              <Select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                <option value="">Select blood group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </Select>
            </Field>

            <Field label="Emergency Contact Phone">
              <Input value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Permanent Residential Address" hint={selectedApp?.address !== address ? '✏️ Modified' : ''}>
              <Textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
            </Field>
          </div>
        </Card>

        {/* Proof Document Uploads */}
        <Card>
          <h3 className="font-display text-lg font-bold text-[#0b1c33]">3. Official Supporting Documents</h3>
          <p className="text-xs text-[#0b1c33]/60 mb-4">
            Upload clear photos or scans proving the requested changes. Supported formats: JPG, PNG, PDF (max 10MB each).
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Field label="Scanned NIC (Front/Back)" hint="Required for Name/NIC changes">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setNicFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-stone-600 file:mr-2 file:rounded-lg file:border-0 file:bg-[#0b1c33] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#16304f]"
                />
              </Field>
            </div>

            <div>
              <Field label="Birth Certificate" hint="Required for DOB / Name corrections">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setBirthCertFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-stone-600 file:mr-2 file:rounded-lg file:border-0 file:bg-[#0b1c33] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#16304f]"
                />
              </Field>
            </div>

            <div>
              <Field label="Additional Supporting Document" hint="Affidavit, deed poll, utility bill">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setAdditionalFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-stone-600 file:mr-2 file:rounded-lg file:border-0 file:bg-[#0b1c33] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#16304f]"
                />
              </Field>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={() => nav('/app/tickets')}>
            Cancel
          </Button>
          <Button type="submit" variant="gold" disabled={submitting}>
            {submitting ? <Spinner /> : 'Submit Support Ticket →'}
          </Button>
        </div>
      </form>
    </div>
  );
}
