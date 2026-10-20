// Schema Validasi Login & Autentikasi SIPANDA (Frontend)

export interface LoginFormInput {
  email: string;
  password: string;
}

export interface LoginFormErrors {
  email?: string;
  password?: string;
}

export interface LoginValidationResult {
  isValid: boolean;
  errors: LoginFormErrors;
  firstError?: string;
}

export const loginValidationSchema = {
  // Aturan Validasi Email Login
  validateEmail: (email: string): string | null => {
    if (!email || !email.trim()) {
      return "Alamat email akun wajib diisi!";
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      return "Format email tidak valid (contoh: nama@example.com)!";
    }
    return null;
  },

  // Aturan Validasi Password Login
  validatePassword: (password: string): string | null => {
    if (!password) {
      return "Password akun wajib diisi!";
    }
    if (password.length < 6) {
      return "Password minimal 6 karakter!";
    }
    return null;
  },

  // Evaluasi Form Login
  validate: (input: LoginFormInput): LoginValidationResult => {
    const errors: LoginFormErrors = {};

    const emailError = loginValidationSchema.validateEmail(input.email);
    if (emailError) errors.email = emailError;

    const passwordError = loginValidationSchema.validatePassword(input.password);
    if (passwordError) errors.password = passwordError;

    const errorKeys = Object.keys(errors) as (keyof LoginFormErrors)[];
    const isValid = errorKeys.length === 0;
    const firstError = !isValid ? errors[errorKeys[0]] : undefined;

    return {
      isValid,
      errors,
      firstError,
    };
  },
};
