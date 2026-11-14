import { Cloud, ShieldCheck, DatabaseBackup, Activity, HardDrive, CheckCircle2 } from 'lucide-react'
import { useStore } from '../store'
import { Badge, Bars, Card, KV, Page, Stat, Table } from '../components/ui'

// Illustrative values: the real figures come from the hosting provider's monitoring once deployed.
const BACKUPS = [
  ['2026-11-12 23:00', 'Scheduled – full', '1.84 GB', 'Success'], ['2026-11-11 23:00', 'Scheduled – full', '1.83 GB', 'Success'],
  ['2026-11-10 23:00', 'Scheduled – full', '1.83 GB', 'Success'], ['2026-11-09 23:00', 'Scheduled – full', '1.81 GB', 'Success'],
  ['2026-11-08 14:20', 'Manual – before update', '1.81 GB', 'Success'], ['2026-11-07 23:00', 'Scheduled – full', '1.80 GB', 'Success'],
].map(([at, type, size, status], i) => ({ id: i, at, type, size, status }))

const CONTROLS = [
  'HTTPS / SSL on every page', 'Role-based access control', 'Secure sign-in with one-time code', 'Session timeout and single active session',
  'Audit trail of every change', 'Input validation and protection against common web vulnerabilities', 'Daily encrypted backups with restore',
  'Data and backups stored in India', 'Security and dependency updates', 'API-ready for ICAR systems, mobile apps, IoT / weather and GIS',
]

export default function System() {
  const { db, can, notify, programme } = useStore()
  return (
    <Page title="Cloud & Security">
      <div className="stack">
        <div className="grid g4">
          <Stat icon={Activity} label="Availability (30 days)" value="99.9%" hint="Application and database" />
          <Stat icon={DatabaseBackup} label="Last backup" value="12 Nov, 23:00" hint="Daily, retained 30 days" />
          <Stat icon={HardDrive} label="Storage used" value="18.4 GB" hint="of 100 GB provisioned" />
          <Stat icon={ShieldCheck} label="SSL certificate" value="Valid" hint="Renews automatically" />
        </div>
        <div className="grid g2">
          <Card title="Hosting">
            <KV items={[
              ['Cloud', 'MeitY-empanelled cloud service provider'], ['Data location', 'India (primary and backup)'], ['Environment', 'Production + staging'],
              ['Application', 'Node.js / Express, React'], ['Database', 'MongoDB (replica set)'], ['Support period', '3 years from Go-Live'],
              ['Registered users', db.users.length], ['Centres', db.centres.length], ['Scheme', programme.short],
            ]} />
          </Card>
          <Card title="Resource usage (last 24 hours)">
            <Bars max={100} fmt={(v) => `${v}%`} data={[{ label: 'CPU', value: 22 }, { label: 'Memory', value: 48 }, { label: 'Database storage', value: 18 }, { label: 'File storage', value: 31 }, { label: 'Bandwidth', value: 12 }]} />
          </Card>
        </div>
        <div className="grid g2">
          <Card title="Backup and restore" pad={false} actions={can('system.manage') && <button className="btn sm" onClick={() => notify('Manual backup started')}><Cloud size={14} /> Back up now</button>}>
            <Table pageSize={6} columns={[
              { label: 'Taken at', key: 'at' }, { label: 'Type', key: 'type' }, { label: 'Size', key: 'size' }, { label: 'Result', render: (r) => <Badge>{r.status}</Badge> },
              { label: '', render: () => can('system.manage') && <button className="btn ghost sm" onClick={() => notify('Restore needs confirmation from the Project Coordinator')}>Restore</button> },
            ]} rows={BACKUPS} />
          </Card>
          <Card title="Security controls">
            <div className="stack" style={{ gap: 8 }}>
              {CONTROLS.map((c) => <div key={c} className="row" style={{ flexWrap: 'nowrap' }}><CheckCircle2 size={16} color="var(--green)" style={{ flex: 'none' }} />{c}</div>)}
            </div>
          </Card>
        </div>
      </div>
    </Page>
  )
}
