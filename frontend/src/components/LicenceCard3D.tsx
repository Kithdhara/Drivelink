import { useState } from 'react';
import type { BackendLicenseRecord } from '../lib/api';

type LicenceCard3DProps =
  | { license: BackendLicenseRecord }
  | {
      fullName: string;
      nic: string;
      classes: string;
      issuedAt: string;
      expiresAt: string;
      photoUrl?: string;
      address?: string;
      bloodGroup?: string;
      dob?: string;
      emergencyContact?: string;
    };

function fmt(d: string) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return d; }
}

export default function LicenceCard3D(props: LicenceCard3DProps) {
  const [flipped, setFlipped] = useState(false);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [wasDragging, setWasDragging] = useState(false);

  const d = 'license' in props
    ? {
        fullName: props.license.applicantName || 'Applicant',
        nic: props.license.nic || '—',
        classes: props.license.category,
        issuedAt: props.license.issuedAt,
        expiresAt: props.license.expiresAt,
        photoUrl: props.license.photoUrl
          ? (() => {
              const raw = props.license.photoUrl;
              // If already a full URL, use it directly
              if (raw.startsWith('http')) return raw;
              // Extract filename and use the correct API path
              const filename = raw.replace(/\\/g, '/').split('/').pop();
              return `http://localhost:8080/api/applications/files/${filename}`;
            })()
          : undefined,
        address: props.license.address,
        bloodGroup: props.license.bloodGroup,
        dob: props.license.dob,
        emergencyContact: props.license.emergencyContact,
        licenseNumber: props.license.licenseNumber,
      }
    : { ...props, licenseNumber: undefined };

  const onDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setWasDragging(false);
    setStartPos({ x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - startPos.x;
    const dy = e.clientY - startPos.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) setWasDragging(true);
    setRotate({ x: Math.max(-25, Math.min(25, rotate.x - dy * 0.4)), y: rotate.y + dx * 0.4 });
    setStartPos({ x: e.clientX, y: e.clientY });
  };
  const onUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (Math.abs(rotate.y) > 70) { setFlipped(!flipped); setRotate({ x: 0, y: 0 }); }
    else setRotate({ x: 0, y: 0 });
  };
  const onClick = () => { if (!wasDragging) setFlipped(!flipped); };

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-[10px] text-[#0b1c33]/40 uppercase tracking-wider">Click to flip · Drag to rotate</p>
      <div
        className="perspective w-full max-w-[420px] cursor-pointer touch-none select-none"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onClick={onClick}
      >
        <div
          className={`relative h-[260px] w-full preserve-3d transition-transform ease-out ${!isDragging ? 'duration-700' : 'duration-75'}`}
          style={{ transform: `rotateX(${rotate.x}deg) rotateY(${flipped ? 180 + rotate.y : rotate.y}deg)` }}
        >
          {/* FRONT */}
          <div className="backface-hidden absolute inset-0 overflow-hidden rounded-2xl shadow-2xl p-5 text-white"
            style={{ background: 'linear-gradient(135deg, #0b1c33 0%, #0e2d5c 50%, #08182b 100%)' }}>
            <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-20 bg-[radial-gradient(ellipse_at_top_right,_#ffffff44_0%,_transparent_60%)]" />
            <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-8 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(255,255,255,0.04)_5px,rgba(255,255,255,0.04)_10px)]" />
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-white/50">Democratic Socialist Republic of</p>
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#c6a15b]">Sri Lanka</h3>
                  <h2 className="font-display text-base font-bold uppercase tracking-wide">Driving Licence</h2>
                </div>
                <img src="/images/sl-emblem.png" alt="" className="h-11 w-11 object-contain opacity-70" onError={(e) => (e.currentTarget.style.display = 'none')} />
              </div>
              <div className="flex items-end gap-4">
                <div className="h-28 w-[84px] shrink-0 overflow-hidden rounded-lg border-2 border-[#c6a15b]/60 bg-white/10 shadow-inner flex items-center justify-center" style={{boxShadow: '0 0 0 1px rgba(198,161,91,0.3), inset 0 2px 4px rgba(0,0,0,0.3)'}}>
                  {d.photoUrl
                    ? <img src={d.photoUrl} alt="Photo" className="h-full w-full object-cover object-top" onError={(e) => { e.currentTarget.style.display = 'none'; const parent = e.currentTarget.parentElement; if (parent) { const span = document.createElement('span'); span.className = 'text-[10px] text-white/40 font-semibold'; span.textContent = 'PHOTO'; parent.appendChild(span); }}} />
                    : <span className="text-[10px] text-white/40 font-semibold">PHOTO</span>}
                </div>
                <div className="flex-1 space-y-1.5 pb-1">
                  {d.licenseNumber && (
                    <div>
                      <p className="text-[8px] font-bold uppercase text-white/50">Licence No.</p>
                      <p className="font-mono text-sm font-bold tracking-wider text-[#c6a15b]">{d.licenseNumber}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[8px] font-bold uppercase text-white/50">Name</p>
                    <p className="text-sm font-bold uppercase truncate">{d.fullName}</p>
                  </div>
                  <div className="flex gap-3">
                    <div><p className="text-[8px] font-bold uppercase text-white/50">NIC</p><p className="text-xs font-semibold">{d.nic}</p></div>
                    <div><p className="text-[8px] font-bold uppercase text-white/50">Class</p><p className="text-xs font-bold text-[#c6a15b] bg-white/10 border border-white/20 px-1.5 rounded-full">{d.classes}</p></div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between border-t border-white/15 pt-2">
                <div><p className="text-[8px] font-bold uppercase text-white/50">Issued</p><p className="font-mono text-[11px] font-semibold">{fmt(d.issuedAt)}</p></div>
                <div className="text-right"><p className="text-[8px] font-bold uppercase text-white/50">Expires</p><p className="font-mono text-[11px] font-semibold">{fmt(d.expiresAt)}</p></div>
              </div>
            </div>
          </div>

          {/* BACK */}
          <div className="backface-hidden rotate-y-180 absolute inset-0 overflow-hidden rounded-2xl shadow-2xl p-5 text-white"
            style={{ background: 'linear-gradient(135deg, #0b1c33 0%, #0d2444 100%)' }}>
            <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-8 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(255,255,255,0.03)_5px,rgba(255,255,255,0.03)_10px)]" />
            <div className="relative z-10 flex h-full flex-col">
              <div className="h-9 w-full bg-black/60 rounded mb-4" />
              <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
                {d.bloodGroup && <div><p className="font-bold uppercase text-white/50 mb-0.5">Blood Group</p><p className="font-bold text-[#c6a15b] text-sm">{d.bloodGroup}</p></div>}
                {d.dob && <div><p className="font-bold uppercase text-white/50 mb-0.5">Date of Birth</p><p className="font-semibold font-mono">{fmt(d.dob)}</p></div>}
                {d.address && <div className="col-span-2"><p className="font-bold uppercase text-white/50 mb-0.5">Address</p><p className="font-semibold leading-tight line-clamp-2">{d.address}</p></div>}
                {d.emergencyContact && <div className="col-span-2"><p className="font-bold uppercase text-white/50 mb-0.5">Emergency Contact</p><p className="font-semibold font-mono">{d.emergencyContact}</p></div>}
                {!d.bloodGroup && !d.dob && !d.address && !d.emergencyContact && (
                  <div className="col-span-2 flex items-center justify-center h-full">
                    <p className="text-white/30 text-xs text-center">Additional details not on record</p>
                  </div>
                )}
              </div>
              <div className="mt-auto border-t border-white/15 pt-2 flex justify-between items-end">
                <p className="text-[8px] text-white/40 max-w-[55%] leading-tight">Property of the Dept. of Motor Traffic, Sri Lanka. If found, return to nearest police station.</p>
                <div className="flex h-7 items-end gap-[1px]">
                  {[1,2,1,3,1,2,1,1,3,2,1,2,1,3,1,1,2,3,1,2,1,1].map((w, i) => (
                    <div key={i} className="bg-white/60 rounded-sm" style={{ width: `${w}px`, height: `${16 + (i % 3) * 4}px` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
