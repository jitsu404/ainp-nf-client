import { AsyncFormModal } from "../../../components/forms";

export function MasterFormModal({
  isEdit,
  item,
  config,
  linkedOptions,
  defaultLinkedTo = "",
  onSubmit,
  onDone,
  onClose,
}) {
  const fields = [
    {
      name: "code",
      label: "Code",
      hint: "Letters, digits, _ or -. Stored in capitals.",
      required: !isEdit,
    },
    { name: "name", label: "Name" },
    ...(config.groups
      ? [
          {
            name: "group",
            label: config.groupLabel ?? "Group",
            type: "select",
            options: config.groups,
            required: false,
            clearable: true,
          },
        ]
      : []),
    ...(config.linkedTo
      ? [
          {
            name: "linkedTo",
            label: config.linkedLabel ?? "Linked",
            type: "select",
            options: linkedOptions ?? [],
            required: false,
            clearable: true,
          },
        ]
      : []),
    {
      name: "sortOrder",
      label: "Sort order",
      type: "number",
      required: false,
      hint: "Lower numbers are listed first.",
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      required: false,
      clearable: true,
    },
  ];

  const initial = isEdit
    ? {
        name: item.name,
        group: item.group ?? "",
        sortOrder: item.sortOrder ?? "",
        description: item.description ?? "",
        linkedTo:
          item.linkedTo?.id ?? item.linkedTo?._id ?? item.linkedTo ?? "",
      }
    : defaultLinkedTo
      ? { linkedTo: defaultLinkedTo }
      : {};

  return (
    <AsyncFormModal
      title={
        isEdit ? `Edit ${item.name}` : `Add to ${config.label.toLowerCase()}`
      }
      fields={isEdit ? fields.filter((f) => f.name !== "code") : fields}
      initial={initial}
      onSubmit={onSubmit}
      onDone={onDone}
      onClose={onClose}
    />
  );
}
