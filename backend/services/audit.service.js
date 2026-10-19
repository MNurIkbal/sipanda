const auditRepository = require('../repositories/audit.repository');

class AuditService {
  async log({
    document_id,
    nomor_surat,
    user_name,
    user_role,
    action,
    description,
    previous_status,
    new_status,
  }) {
    return auditRepository.create({
      document_id,
      nomor_surat,
      user_name,
      user_role,
      action,
      description,
      previous_status,
      new_status,
    });
  }

  async getLogs(filters) {
    return auditRepository.findAll(filters);
  }
}

module.exports = new AuditService();
