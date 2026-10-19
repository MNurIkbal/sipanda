class User {
  constructor({
    id,
    email,
    password_hash,
    full_name,
    nip,
    role,
    unit_kerja,
    phone,
    avatar_url,
    is_active = true,
    created_at = new Date().toISOString(),
  }) {
    this.id = id;
    this.email = email || '';
    this.password_hash = password_hash;
    this.full_name = full_name;
    this.nip = nip || '';
    this.role = role || 'ppk'; // 'biro_01' | 'ppk' | 'superadmin'
    this.unit_kerja = unit_kerja || '';
    this.phone = phone || '';
    this.avatar_url = avatar_url || '';
    this.is_active = is_active;
    this.created_at = created_at;
  }

  toSafeObject() {
    const { password_hash, ...safe } = this;
    return safe;
  }
}

module.exports = User;
