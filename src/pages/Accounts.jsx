import { useState } from 'react'
import { KeyRound, Power, UserPlus } from 'lucide-react'
import { useAuth } from '../auth'
import { AsyncFormModal, CredentialsModal, ErrorNote } from '../components/forms'
import { Badge, Card, Page, Table, Tabs } from '../components/ui'
import { PASSWORD_RULE } from '../config/constants'
import { formatDateTime } from '../hooks'
import { toast } from '../lib/toast'
import { useActivateUser, useCreateUser, useDeactivateUser, useResetPassword, useUsers } from '../queries/users'

const tempPasswordField = { name: 'temporaryPassword', label: 'Temporary password', generate: true, full: true, hint: `${PASSWORD_RULE.text} They must change it at first sign-in.` }

/**
 * PCU and Super Admin accounts. Only roles the signed-in user may manage are shown
 * (from the session), so in practice this page is for the Super Admin.
 * Centre PIs are managed from each centre's page instead.
 */
export default function Accounts() {
  const { assignable, user: me } = useAuth()
  // PCU first: that is what this page is mostly for.
  const roles = assignable.filter((r) => r.id !== 'pi').sort((a, b) => (a.id === 'pc' ? -1 : b.id === 'pc' ? 1 : 0))
  const [roleId, setRoleId] = useState(roles[0]?.id ?? 'pc')
  const [modal, setModal] = useState(null) // { type, user? }
  const [credentials, setCredentials] = useState(null)

  const users = useUsers({ roleId })
  const createUser = useCreateUser()
  const resetPassword = useResetPassword()
  const deactivateUser = useDeactivateUser()
  const activateUser = useActivateUser()

  const rows = users.data?.data ?? []
  const close = () => setModal(null)
  const roleLabel = roles.find((r) => r.id === roleId)?.label ?? ''

  return (
    <Page title="PCU accounts"
      actions={<button className="btn" onClick={() => setModal({ type: 'add' })}><UserPlus size={15} /> Add account</button>}>
      <div className="stack">
        <p className="muted">
          PCU users manage centres and assign Centre PIs, the same as the Super Admin. Only the Super Admin can create or deactivate PCU accounts.
        </p>
        <ErrorNote error={users.error} />
        <Card pad={false}>
          <Tabs value={roleId} onChange={setRoleId} tabs={roles.map((r) => [r.id, r.label])} />
          <Table
            rows={rows}
            empty={users.isPending ? 'Loading…' : `No ${roleLabel} accounts yet.`}
            columns={[
              { label: 'Name', render: (u) => <b style={{ fontWeight: 550 }}>{u.name}{u.id === me.id && <span className="muted"> (you)</span>}</b> },
              { label: 'Designation', render: (u) => u.designation || '—' },
              { label: 'Email', key: 'email' },
              { label: 'Last sign-in', render: (u) => <span className="nowrap">{formatDateTime(u.lastLoginAt)}</span> },
              {
                label: 'Status',
                render: (u) => (!u.isActive ? <Badge>Inactive</Badge> : u.mustChangePassword ? <Badge tone="amber">Awaiting first sign-in</Badge> : <Badge>Active</Badge>),
              },
              {
                label: '',
                render: (u) => u.id !== me.id && (
                  <span className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                    {u.isActive && <button className="btn ghost sm" onClick={() => setModal({ type: 'reset', user: u })}><KeyRound size={13} /> Reset password</button>}
                    <button className={`btn sm ${u.isActive ? 'danger' : 'ghost'}`} onClick={() => setModal({ type: u.isActive ? 'deactivate' : 'activate', user: u })}>
                      <Power size={13} /> {u.isActive ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </span>
                ),
              },
            ]}
          />
        </Card>
      </div>

      {modal?.type === 'add' && (
        <AsyncFormModal
          title="Add account"
          fields={[
            { name: 'roleId', label: 'Role', type: 'select', options: roles.map((r) => [r.id, r.label]) },
            { name: 'name', label: 'Full name' },
            { name: 'designation', label: 'Designation', required: false, hint: 'e.g. National PI, Principal Scientist' },
            { name: 'email', label: 'Email (used to sign in)', type: 'email' },
            { name: 'phone', label: 'Phone', type: 'tel', required: false },
            tempPasswordField,
          ]}
          initial={{ roleId }}
          submitLabel="Create account"
          onSubmit={createUser.mutateAsync}
          onDone={(u, body) => {
            setCredentials({ name: u.name, email: u.email, password: body.temporaryPassword })
            setRoleId(u.roleId)
          }}
          onClose={close}
        />
      )}

      {modal?.type === 'reset' && (
        <AsyncFormModal
          title={`Reset password for ${modal.user.name}`}
          intro={<p className="muted">They’ll be signed out everywhere and must choose a new password at their next sign-in.</p>}
          fields={[tempPasswordField]}
          submitLabel="Reset password"
          onSubmit={(body) => resetPassword.mutateAsync({ id: modal.user.id, ...body })}
          onDone={(_r, body) => setCredentials({ name: modal.user.name, email: modal.user.email, password: body.temporaryPassword, title: 'Password reset' })}
          onClose={close}
        />
      )}

      {modal?.type === 'deactivate' && (
        <AsyncFormModal
          title={`Deactivate ${modal.user.name}?`}
          intro={<div className="note warn">They can no longer sign in. Their account and everything they recorded are kept.</div>}
          fields={[{ name: 'reason', label: 'Reason', type: 'textarea' }]}
          submitLabel="Deactivate"
          onSubmit={(body) => deactivateUser.mutateAsync({ id: modal.user.id, reason: body.reason })}
          onDone={() => toast.success(`${modal.user.name} deactivated`)}
          onClose={close}
        />
      )}

      {modal?.type === 'activate' && (
        <AsyncFormModal
          title={`Reactivate ${modal.user.name}?`}
          fields={[]}
          submitLabel="Reactivate"
          onSubmit={() => activateUser.mutateAsync({ id: modal.user.id })}
          onDone={() => toast.success(`${modal.user.name} reactivated`)}
          onClose={close}
        />
      )}

      {credentials && <CredentialsModal {...credentials} onClose={() => setCredentials(null)} />}
    </Page>
  )
}
