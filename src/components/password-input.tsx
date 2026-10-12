import {useState, type ComponentProps} from 'react';
import {EyeIcon, EyeSlashIcon} from '@phosphor-icons/react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';

/** Password field with show/hide toggle. Use inside Field; never nest raw Input in InputGroup. */
export function PasswordInput({
  disabled,
  ...props
}: Omit<ComponentProps<typeof InputGroupInput>, 'type'>) {
  const [visible, setVisible] = useState(false);

  return (
    <InputGroup data-disabled={disabled || undefined}>
      <InputGroupInput
        type={visible ? 'text' : 'password'}
        disabled={disabled}
        {...props}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          disabled={disabled}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? <EyeSlashIcon /> : <EyeIcon />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
