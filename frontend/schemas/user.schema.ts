// Schema Validasi Pengguna SIPANDU (Frontend)
export interface UserFormInput {
  email: string;
  password?: string;
  full_name: string;
  role: 'biro_01' | 'ppk' | 'superadmin' | string;
  nip?: string;
  unit_kerja?: string;
  phone?: string;
}

export interface UserValidationError {
  email?: string;
  password?: string;
  full_name?: string;
  role?: string;
  nip?: string;
  unit_kerja?: string;
  phone?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: UserValidationError;
  firstError?: string;
}

export const userValidationSchema = {
  // Aturan Validasi Email
  validateEmail: (email: string): string | null => {
    if (!email || !email.trim()) {
      return "Alamat email wajib diisi!";
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      return "Format email tidak valid (contoh: user@example.com)!";
    }
    if (email.length > 100) {
      return "Email maksimal 100 karakter!";
    }
    return null;
  },

  // Aturan Validasi Password (min 8 karakter, ada huruf besar dan kecil)
  validatePassword: (password: string, isRequired = true): string | null => {
    if (!password || !password.trim()) {
      return isRequired ? "Password wajib diisi!" : null;
    }
    if (password.length < 8) {
      return "Password minimal harus memiliki 8 karakter!";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password harus memuat minimal 1 huruf besar (A-Z)!";
    }
    if (!/[a-z]/.test(password)) {
      return "Password harus memuat minimal 1 huruf kecil (a-z)!";
    }
    return null;
  },

  // Aturan Validasi Nama Lengkap
  validateFullName: (fullName: string): string | null => {
    if (!fullName || !fullName.trim()) {
      return "Nama lengkap dan gelar wajib diisi!";
    }
    if (fullName.trim().length < 3) {
      return "Nama lengkap minimal 3 karakter!";
    }
    if (fullName.length > 100) {
      return "Nama lengkap maksimal 100 karakter!";
    }
    return null;
  },

  // Aturan Validasi Role
  validateRole: (role: string): string | null => {
    const validRoles = ["biro_01", "ppk", "superadmin"];
    if (!role || !validRoles.includes(role)) {
      return "Role harus dipilih: Biro 01, PPK, atau Superadmin!";
    }
    return null;
  },

  // Aturan Validasi NIP (opsional, jika diisi dicek angka dan panjang)
  validateNip: (nip?: string): string | null => {
    if (!nip || !nip.trim()) return null; // Opsional
    const cleanNip = nip.trim();
    if (cleanNip.length > 30) {
      return "NIP maksimal 30 karakter!";
    }
    return null;
  },

  // Aturan Validasi Unit Kerja (opsional)
  validateUnitKerja: (unitKerja?: string): string | null => {
    if (!unitKerja || !unitKerja.trim()) return null; // Opsional
    if (unitKerja.trim().length > 100) {
      return "Unit kerja maksimal 100 karakter!";
    }
    return null;
  },

  // Aturan Validasi Nomor Telepon (opsional, jika diisi format nomor)
  validatePhone: (phone?: string): string | null => {
    if (!phone || !phone.trim()) return null; // Opsional
    const cleanPhone = phone.trim();
    if (cleanPhone.length > 20) {
      return "Nomor telepon maksimal 20 digit!";
    }
    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (!phoneRegex.test(cleanPhone)) {
      return "Nomor telepon hanya boleh memuat angka, +, -, atau spasi!";
    }
    return null;
  },

  // Evaluasi Form Penuh Berdasarkan Schema
  validate: (data: UserFormInput, isCreateMode = true): ValidationResult => {
    const errors: UserValidationError = {};

    const emailErr = userValidationSchema.validateEmail(data.email);
    if (emailErr) errors.email = emailErr;

    const passwordErr = userValidationSchema.validatePassword(
      data.password || "",
      isCreateMode
    );
    if (passwordErr) errors.password = passwordErr;

    const fullNameErr = userValidationSchema.validateFullName(data.full_name);
    if (fullNameErr) errors.full_name = fullNameErr;

    const roleErr = userValidationSchema.validateRole(data.role);
    if (roleErr) errors.role = roleErr;

    const nipErr = userValidationSchema.validateNip(data.nip);
    if (nipErr) errors.nip = nipErr;

    const unitKerjaErr = userValidationSchema.validateUnitKerja(data.unit_kerja);
    if (unitKerjaErr) errors.unit_kerja = unitKerjaErr;

    const phoneErr = userValidationSchema.validatePhone(data.phone);
    if (phoneErr) errors.phone = phoneErr;

    const errorKeys = Object.keys(errors) as (keyof UserValidationError)[];
    const isValid = errorKeys.length === 0;
    const firstError = !isValid ? errors[errorKeys[0]] : undefined;

    return {
      isValid,
      errors,
      firstError,
    };
  },
};
