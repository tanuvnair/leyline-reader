export interface PasswordPolicy {
  minLength: number;
  requireLetter: boolean;
  requireNumber: boolean;
  requireSpecial: boolean;
}

export function assertPasswordPolicy(
  password: string,
  policy: PasswordPolicy,
): void {
  if (password.length < policy.minLength) {
    throw new Error(
      `Password must be at least ${policy.minLength} characters`,
    );
  }
  if (policy.requireLetter && !/[A-Za-z]/.test(password)) {
    throw new Error('Password must include a letter');
  }
  if (policy.requireNumber && !/\d/.test(password)) {
    throw new Error('Password must include a number');
  }
  if (
    policy.requireSpecial &&
    !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)
  ) {
    throw new Error('Password must include a special character');
  }
}
