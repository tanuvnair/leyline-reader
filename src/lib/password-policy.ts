export interface PasswordPolicy {
  minLength: number;
  requireLetter: boolean;
  requireNumber: boolean;
  requireSpecial: boolean;
}

/** Client-side checks aligned with electron/auth/session assertPasswordPolicy. */
export function validateNewPassword(
  password: string,
  policy: PasswordPolicy,
): string | null {
  if (!password) {
    return 'Enter a password';
  }
  if (password.length < policy.minLength) {
    return `Password must be at least ${policy.minLength} characters`;
  }
  if (policy.requireLetter && !/[A-Za-z]/.test(password)) {
    return 'Password must include a letter';
  }
  if (policy.requireNumber && !/\d/.test(password)) {
    return 'Password must include a number';
  }
  if (
    policy.requireSpecial &&
    !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)
  ) {
    return 'Password must include a special character';
  }
  return null;
}

export function validateRequiredPassword(password: string): string | null {
  if (!password) {
    return 'Enter a password';
  }
  return null;
}

/** Human-readable policy for FieldDescription (not native constraint tooltips). */
export function describePasswordPolicy(policy: PasswordPolicy): string {
  const parts = [`at least ${policy.minLength} characters`];
  if (policy.requireLetter) {
    parts.push('a letter');
  }
  if (policy.requireNumber) {
    parts.push('a number');
  }
  if (policy.requireSpecial) {
    parts.push('a special character');
  }
  if (parts.length === 1) {
    return `Use ${parts[0]}.`;
  }
  const last = parts.pop()!;
  return `Use ${parts.join(', ')}, and ${last}.`;
}
