import { PASSWORD_RULE, TITLES } from '../config/constants'

// Person details, as in the PCU master table ("Users" sheet):
// Title | First Name | Middle Name | Surname | Designation | Email | Mobile | Organization Name.
// Used by "Assign / replace Centre PI", "Edit PI" and "Add account". The server builds the display
// name ("Dr. Sujit Kumar Singh") from the parts.

/** Fields for AsyncFormModal. On edit forms, emptied middle name / surname are sent as null (cleared). */
export const personFields = ({ edit = false } = {}) => [
  { name: 'title', label: 'Title', type: 'select', options: TITLES },
  { name: 'firstName', label: 'First name' },
  { name: 'middleName', label: 'Middle name', required: false, clearable: edit },
  { name: 'surname', label: 'Surname', required: false, clearable: edit, hint: 'Leave empty if there is none' },
  { name: 'designation', label: 'Designation', hint: 'e.g. Chief Agronomist, Principal Scientist' },
  { name: 'email', label: 'Email (used to sign in)', type: 'email' },
  { name: 'mobile', label: 'Mobile', type: 'tel', hint: '10-digit number, e.g. 98765 43210' },
  { name: 'organization', label: 'Organization name', full: true },
]

export const temporaryPasswordField = {
  name: 'temporaryPassword',
  label: 'Temporary password',
  generate: true,
  full: true,
  hint: `${PASSWORD_RULE.text} They must change it at first sign-in.`,
}

/** Current values of a user, for pre-filling an edit form. */
export const personValues = (user) => ({
  title: user.title ?? '',
  firstName: user.firstName ?? '',
  middleName: user.middleName ?? '',
  surname: user.surname ?? '',
  designation: user.designation ?? '',
  email: user.email ?? '',
  mobile: user.mobile ?? '',
  organization: user.organization ?? '',
})
