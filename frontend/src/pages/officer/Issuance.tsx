import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { getAllApplicationsAPI, issueLicenseAPI, type BackendApplication } from '../../lib/api';
import { Button, Card, PageHeader, Empty } from '../../components/ui';
import { Award, CheckCircle2, Search } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import LicenceCard3D from '../../components/LicenceCard3D';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function OfficerIssuance() {
  const { user } = useAuth();
  const [apps, setApps] = useState<BackendApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [confirmApp, setConfirmApp] = useState<BackendApplication | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const data = await getAllApplicationsAPI();
      setApps(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleIssue(app: BackendApplication) {
    if (!user) return;
    setBusy(app.id);
    setConfirmApp(null);
    try {
      await issueLicenseAPI(app.id, user.id);
      await fetchData();
    } catch (error: any) {
      alert(error.message || 'Failed to issue license');
    } finally {
      setBusy(null);
    }
  }

  const pendingApps = apps.filter(
    (a) =>
      a.status === 'trial_passed' &&
      (a.nic.toLowerCase().includes(search.toLowerCase()) || a.fullName.toLowerCase().includes(search.toLowerCase()))
  );
  
  const issuedApps = apps.filter(
    (a) =>
      a.status === 'license_issued' &&
      (a.nic.toLowerCase().includes(search.toLowerCase()) || a.fullName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          kicker="Final Step"
          title="Licence Issuance"
          subtitle="Issue final driving licenses to applicants who have successfully passed their practical driving trials."
        />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl shadow-sm border border-[#0b1c33]/10">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0b1c33]/40" />
            <input
              type="text"
              placeholder="Search by NIC or Applicant Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-[#0b1c33]/15 py-2 pl-9 pr-4 text-sm focus:border-[#c6a15b] focus:outline-none focus:ring-1 focus:ring-[#c6a15b]"
            />
          </div>
          <div className="text-sm font-semibold text-[#0b1c33]/70">
            {pendingApps.length} pending issuance
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-display text-lg font-bold text-[#0b1c33] flex items-center gap-2">
              <Award className="h-5 w-5 text-[#c6a15b]" /> Ready for Issuance
            </h3>
            
            {loading ? (
              <div className="animate-pulse flex flex-col gap-3">
                {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white rounded-xl shadow-sm"></div>)}
              </div>
            ) : pendingApps.length === 0 ? (
              <Empty
                title="No pending issuances"
                hint="There are no applicants waiting for license issuance at the moment."
              />
            ) : (
              pendingApps.map((app) => (
                <Card key={app.id} className="group hover:border-[#c6a15b]/50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-[#0b1c33] leading-tight">{app.fullName}</h4>
                      <p className="text-xs text-[#0b1c33]/60 font-mono mt-0.5">{app.nic}</p>
                    </div>
                    <span className="bg-[#c6a15b]/20 text-[#0b1c33] px-2 py-1 rounded text-xs font-bold">
                      Class {app.licenseClasses}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#0b1c33]/5">
                    <div className="text-[10px] text-[#0b1c33]/50">
                      <p>App #{app.id}</p>
                      <p>Trial Passed on: {formatDate(app.updatedAt)}</p>
                    </div>
                    <Button 
                      variant="gold" 
                      size="sm"
                      onClick={() => setConfirmApp(app)}
                      disabled={busy === app.id}
                    >
                      {busy === app.id ? 'Issuing...' : 'Issue Licence'}
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>

          <div className="space-y-4">
            <h3 className="font-display text-lg font-bold text-[#0b1c33] flex items-center gap-2 opacity-60">
              <CheckCircle2 className="h-5 w-5" /> Recently Issued
            </h3>
            
            {loading ? (
              <div className="animate-pulse flex flex-col gap-3">
                {[1, 2].map(i => <div key={i} className="h-20 bg-white/50 rounded-xl"></div>)}
              </div>
            ) : issuedApps.length === 0 ? (
              <div className="text-sm text-[#0b1c33]/50 italic">No recently issued licenses found.</div>
            ) : (
              issuedApps.slice(0, 10).map((app) => (
                <div key={app.id} className="mb-6 last:mb-0 p-4 bg-white/60 rounded-xl border border-[#0b1c33]/5">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                      Successfully Issued
                    </span>
                    <span className="text-[10px] text-[#0b1c33]/40">
                      App #{app.id} • {formatDate(app.updatedAt)}
                    </span>
                  </div>
                  <LicenceCard3D 
                    fullName={app.fullName}
                    nic={app.nic}
                    classes={app.licenseClasses}
                    issuedAt={formatDate(app.updatedAt)}
                    expiresAt={formatDate(new Date(new Date(app.updatedAt).setFullYear(new Date(app.updatedAt).getFullYear() + 8)).toISOString())}
                    photoUrl={app.passportPhotoPath ? `http://localhost:8080/api/${app.passportPhotoPath}` : undefined}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmApp}
        title="Issue Driving Licence"
        message={confirmApp ? `Confirm issuing a driving licence to ${confirmApp.fullName} (NIC: ${confirmApp.nic}, Class: ${confirmApp.licenseClasses}). This action cannot be undone.` : ''}
        confirmLabel="Yes, Issue Licence"
        cancelLabel="Cancel"
        variant="primary"
        onConfirm={() => confirmApp && handleIssue(confirmApp)}
        onCancel={() => setConfirmApp(null)}
      />
    </>
  );
}
