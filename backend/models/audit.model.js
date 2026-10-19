class AuditTrail {
  constructor({
    id = Date.now(),
    document_id = null,
    nomor_surat = '-',
    user_name = 'System',
    user_role = 'system',
    action,
    description,
    previous_status = '-',
    new_status = '-',
    created_at = new Date().toISOString(),
  }) {
    this.id = id;
    this.document_id = document_id;
    this.nomor_surat = nomor_surat;
    this.user_name = user_name;
    this.user_role = user_role;
    this.action = action;
    this.description = description;
    this.previous_status = previous_status;
    this.new_status = new_status;
    this.created_at = created_at;
  }
}

module.exports = AuditTrail;
