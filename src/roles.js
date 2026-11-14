import { programme } from './programme/config'

// Modules listed in the Statement of Work (Annexure I and II).
export const MODULES = [
  { id: 'dashboard', label: 'Dashboard', path: '/', icon: 'LayoutDashboard', group: 'Overview' },
  { id: 'research', label: programme.researchLabel, path: '/research', icon: 'FlaskConical', group: 'Research' },
  { id: 'administration', label: 'Administration', path: '/administration', icon: 'Briefcase', group: 'Administration & Finance' },
  { id: 'communication', label: 'Communication', path: '/communication', icon: 'Mail', group: 'Administration & Finance' },
  { id: 'finance', label: 'Sanction & Finance', path: '/finance', icon: 'IndianRupee', group: 'Administration & Finance' },
  { id: 'aucsoe', label: 'AUC / SoE', path: '/auc-soe', icon: 'FileCheck2', group: 'Administration & Finance' },
  { id: 'staff', label: 'Staff Management', path: '/staff', icon: 'Users', group: 'Administration & Finance' },
  { id: 'meetings', label: 'Meetings & Monitoring', path: '/meetings', icon: 'CalendarCheck', group: 'Monitoring' },
  { id: 'documents', label: 'Document Repository', path: '/documents', icon: 'FolderOpen', group: 'Monitoring' },
  { id: 'reports', label: 'Reports', path: '/reports', icon: 'BarChart3', group: 'Monitoring' },
  { id: 'masters', label: 'Masters', path: '/masters', icon: 'Database', group: 'Setup' },
  { id: 'users', label: 'Users & Workflow', path: '/users', icon: 'ShieldCheck', group: 'Setup' },
  { id: 'system', label: 'Cloud & Security', path: '/system', icon: 'Cloud', group: 'Setup' },
]

const ALL = MODULES.map((m) => m.id)

// Every capability. Mirrors CAPABILITIES in icar-nf-backend/src/config/constants.ts.
const ALL_CAPABILITIES = [
  'research.enter', 'research.submit', 'research.review', 'research.approve', 'research.config',
  'finance.manage', 'finance.expenditure', 'finance.receipt', 'finance.request',
  'aucsoe.enter', 'aucsoe.submit', 'aucsoe.review', 'aucsoe.approve',
  'comm.issue', 'comm.ack', 'staff.manage', 'staff.propose', 'meetings.manage', 'meetings.update',
  'admin.manage', 'admin.approve', 'admin.request', 'docs.upload',
  'masters.edit', 'centres.manage', 'users.manage', 'system.manage',
]

// Roles named in the SOW: Project Coordinator / Coordinating Unit, Finance / Admin users,
// Nodal / PI / Centre Scientist, data-entry staff, reviewers and administrator,
// plus a Super Administrator with every permission.
export const ROLES = {
  superadmin: {
    id: 'superadmin', label: 'Super Administrator', scope: 'national', level: 'System',
    about: 'Every permission in every module. Creates the PCU accounts; kept to one or two people.',
    user: { name: 'Super Administrator', designation: 'Super Administrator' },
    modules: ALL,
    can: ALL_CAPABILITIES,
  },
  pc: {
    id: 'pc', label: 'Project Coordinator', scope: 'national', level: programme.unit,
    about: 'Creates centres and assigns PIs, approves and locks submissions, issues sanctions and communications.',
    user: { name: 'Dr. S. K. Rathore', designation: 'Project Coordinator' },
    modules: ALL.filter((m) => m !== 'system'),
    can: ['centres.manage', 'users.manage', 'research.approve', 'research.config', 'aucsoe.approve', 'finance.manage',
      'comm.issue', 'staff.manage', 'meetings.manage', 'admin.manage', 'admin.approve', 'docs.upload'],
  },
  finance: {
    id: 'finance', label: 'Finance Officer', scope: 'national', level: programme.unit,
    about: 'Manages allocations, sanction and release orders, and scrutinises AUC / SoE.',
    user: { name: 'Anita Bhatia', designation: 'Finance & Accounts Officer' },
    modules: ['dashboard', 'communication', 'finance', 'aucsoe', 'meetings', 'documents', 'reports'],
    can: ['finance.manage', 'aucsoe.review', 'docs.upload'],
  },
  adminOfficer: {
    id: 'adminOfficer', label: 'Administrative Officer', scope: 'national', level: programme.unit,
    about: 'Handles approvals, office orders, correspondence, project staff and meetings.',
    user: { name: 'Manoj Tiwari', designation: 'Administrative Officer' },
    modules: ['dashboard', 'administration', 'communication', 'staff', 'meetings', 'documents', 'reports'],
    can: ['comm.issue', 'staff.manage', 'meetings.manage', 'admin.manage', 'docs.upload'],
  },
  reviewer: {
    id: 'reviewer', label: 'Reviewer', scope: 'national', level: programme.unit,
    about: 'Validates research data and scrutinises submissions before approval.',
    user: { name: 'Dr. Meera Krishnan', designation: 'Principal Scientist (Reviewer)' },
    modules: ['dashboard', 'research', 'communication', 'aucsoe', 'documents', 'reports'],
    can: ['research.review', 'aucsoe.review'],
  },
  pi: {
    id: 'pi', label: 'Nodal Officer / PI', scope: 'centre', level: 'Centre',
    about: 'Centre Scientist in charge: submits research data, expenditure, AUC / SoE and replies.',
    user: { designation: 'Nodal Officer / Principal Investigator' },
    modules: ['dashboard', 'research', 'administration', 'communication', 'finance', 'aucsoe', 'staff', 'meetings', 'documents', 'reports'],
    can: ['research.enter', 'research.submit', 'finance.expenditure', 'finance.receipt', 'finance.request',
      'aucsoe.enter', 'aucsoe.submit', 'comm.ack', 'staff.propose', 'meetings.update', 'admin.request', 'docs.upload'],
  },
  dataEntry: {
    id: 'dataEntry', label: 'Data Entry Staff', scope: 'centre', level: 'Centre',
    about: 'Enters observations and expenditure and uploads documents as drafts for the PI.',
    user: { designation: 'Data Entry Operator' },
    modules: ['dashboard', 'research', 'communication', 'finance', 'aucsoe', 'documents'],
    can: ['research.enter', 'finance.expenditure', 'aucsoe.enter', 'docs.upload'],
  },
  admin: {
    id: 'admin', label: 'Administrator', scope: 'national', level: 'System',
    about: 'Maintains masters, users and roles, manages records in every module, and monitors hosting and backups.',
    user: { name: 'Rohit Verma', designation: 'System Administrator' },
    modules: ALL,
    can: ['masters.edit', 'users.manage', 'system.manage', 'docs.upload', 'comm.issue', 'meetings.manage',
      'staff.manage', 'admin.manage', 'finance.manage', 'research.config'],
  },
}

export const ROLE_LIST = Object.values(ROLES)

// Which roles each role may give to an account. Mirrors ASSIGNABLE_ROLES on the server:
// only the PCU and Super Administrator create PI / data-entry accounts, and only a
// Super Administrator creates Project Coordinator, Administrator or Super Administrator accounts.
export const ASSIGNABLE_ROLES = {
  superadmin: Object.keys(ROLES),
  pc: ['pi', 'dataEntry', 'reviewer', 'finance', 'adminOfficer'],
  admin: ['reviewer', 'finance', 'adminOfficer'],
  finance: [], adminOfficer: [], reviewer: [], pi: [], dataEntry: [],
}

export const canAssignRole = (actorRoleId, targetRoleId) => (ASSIGNABLE_ROLES[actorRoleId] || []).includes(targetRoleId)

// Capabilities shown in the permission matrix on the Users & Workflow page.
export const CAPABILITIES = [
  ['research.enter', 'Enter research data'],
  ['research.submit', 'Submit research data'],
  ['research.review', 'Validate research data'],
  ['research.approve', 'Approve & lock research data'],
  ['research.config', 'Configure indicators'],
  ['finance.manage', 'Manage allocation & releases'],
  ['finance.expenditure', 'Enter expenditure'],
  ['finance.receipt', 'Confirm fund receipt'],
  ['aucsoe.submit', 'Submit AUC / SoE'],
  ['aucsoe.review', 'Scrutinise AUC / SoE'],
  ['aucsoe.approve', 'Approve AUC / SoE'],
  ['comm.issue', 'Issue communications'],
  ['comm.ack', 'Acknowledge & reply'],
  ['staff.manage', 'Manage project staff'],
  ['meetings.manage', 'Manage meetings'],
  ['docs.upload', 'Upload documents'],
  ['masters.edit', 'Edit masters'],
  ['centres.manage', 'Create & edit centres'],
  ['users.manage', 'Manage users & roles'],
  ['system.manage', 'Backups & monitoring'],
]

export const WORKFLOW_STAGES = ['Draft', 'Submitted', 'Scrutinised', 'Approved']
