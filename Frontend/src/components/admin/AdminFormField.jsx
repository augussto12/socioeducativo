import './AdminComponents.css';

export default function AdminFormField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  as = 'input',
  options = [],
  required = false,
  placeholder = '',
  min,
}) {
  const id = `field-${name}`;
  const commonProps = {
    id,
    name,
    value: value ?? '',
    onChange,
    required,
    placeholder,
  };

  return (
    <label className="admin-field" htmlFor={id}>
      <span>{label}{required ? ' *' : ''}</span>
      {as === 'textarea' ? (
        <textarea {...commonProps} rows={5} />
      ) : as === 'select' ? (
        <select {...commonProps}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input {...commonProps} type={type} min={min} />
      )}
    </label>
  );
}
