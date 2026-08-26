import { useState } from 'react';
import { useStore } from '../../lib/store';
import { formatDateTime } from '../../lib/utils';
import { PageHeader, SearchBox, TableWrap, Td, Th } from '../../components/ui';

export default function AdminAudit() {
  const { state } = useStore();
  const [q, setQ] = useState('');
  const needle = q.trim().toLowerCase();
  const rows = state.audit.filter(
    (a) =>
      !needle ||
      a.action.toLowerCase().includes(needle) ||
      a.userName.toLowerCase().includes(needle) ||
      a.entityId.toLowerCase().includes(needle) ||
      a.details.toLowerCase().includes(needle),
  );

  return (
    <div>
      <PageHeader kicker="Integrity" title="Audit log" subtitle="Key actions — logins, document decisions, results and licence issues." />
      <div className="mb-4 max-w-md">
        <SearchBox value={q} onChange={setQ} placeholder="Action, officer or file" />
      </div>
      <TableWrap>
        <thead>
          <tr>
            <Th>When</Th>
            <Th>Actor</Th>
            <Th>Action</Th>
            <Th>Entity</Th>
            <Th>Details</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.id}>
              <Td className="whitespace-nowrap text-xs">{formatDateTime(a.createdAt)}</Td>
              <Td>{a.userName}</Td>
              <Td className="font-mono text-xs">{a.action}</Td>
              <Td>
                {a.entity}
                <div className="text-[11px] text-[#0b1c33]/45">{a.entityId}</div>
              </Td>
              <Td className="text-sm">{a.details}</Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </div>
  );
}
