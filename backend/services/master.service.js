const masterRepository = require('../repositories/master.repository');

class MasterService {
  // ===================== UNITS =====================
  async getAllUnits(query) {
    return await masterRepository.findAllUnits(query);
  }

  async createUnit(data) {
    if (!data.nama || !data.nama.trim()) {
      throw new Error('Nama unit wajib diisi!');
    }
    const cleanName = data.nama.trim();

    // Validasi duplikasi nama unit (case-insensitive)
    const existing = await masterRepository.findUnitByName(cleanName);
    if (existing) {
      throw new Error(`Unit dengan nama "${cleanName}" sudah ada! Nama unit tidak boleh sama.`);
    }

    return await masterRepository.createUnit({
      nama: cleanName,
      keterangan: data.keterangan,
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
    });
  }

  async updateUnit(id, data) {
    const existingUnit = await masterRepository.findUnitById(id);
    if (!existingUnit) {
      throw new Error('Unit tidak ditemukan!');
    }

    if (data.nama !== undefined && !data.nama.trim()) {
      throw new Error('Nama unit wajib diisi!');
    }
    const cleanName = data.nama ? data.nama.trim() : existingUnit.nama;

    // Validasi duplikasi dengan record lain
    const duplicate = await masterRepository.findUnitByName(cleanName, id);
    if (duplicate) {
      throw new Error(`Unit dengan nama "${cleanName}" sudah digunakan! Nama unit tidak boleh sama.`);
    }

    return await masterRepository.updateUnit(id, {
      nama: data.nama !== undefined ? cleanName : undefined,
      keterangan: data.keterangan,
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : undefined,
    });
  }

  async deleteUnit(id) {
    const existing = await masterRepository.findUnitById(id);
    if (!existing) {
      throw new Error('Unit tidak ditemukan!');
    }
    return await masterRepository.deleteUnit(id);
  }

  // ===================== JENIS DOKUMEN =====================
  async getAllJenisDokumen(query) {
    return await masterRepository.findAllJenisDokumen(query);
  }

  async createJenisDokumen(data) {
    if (!data.nama || !data.nama.trim()) {
      throw new Error('Nama jenis dokumen wajib diisi!');
    }
    const cleanName = data.nama.trim();

    // Validasi duplikasi nama jenis dokumen (case-insensitive)
    const existing = await masterRepository.findJenisDokumenByName(cleanName);
    if (existing) {
      throw new Error(`Jenis dokumen dengan nama "${cleanName}" sudah ada! Nama jenis dokumen tidak boleh sama.`);
    }

    return await masterRepository.createJenisDokumen({
      nama: cleanName,
      keterangan: data.keterangan,
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
    });
  }

  async updateJenisDokumen(id, data) {
    const existing = await masterRepository.findJenisDokumenById(id);
    if (!existing) {
      throw new Error('Jenis dokumen tidak ditemukan!');
    }

    if (data.nama !== undefined && !data.nama.trim()) {
      throw new Error('Nama jenis dokumen wajib diisi!');
    }
    const cleanName = data.nama ? data.nama.trim() : existing.nama;

    // Validasi duplikasi dengan record lain
    const duplicate = await masterRepository.findJenisDokumenByName(cleanName, id);
    if (duplicate) {
      throw new Error(`Jenis dokumen dengan nama "${cleanName}" sudah digunakan! Nama jenis dokumen tidak boleh sama.`);
    }

    return await masterRepository.updateJenisDokumen(id, {
      nama: data.nama !== undefined ? cleanName : undefined,
      keterangan: data.keterangan,
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : undefined,
    });
  }

  async deleteJenisDokumen(id) {
    const existing = await masterRepository.findJenisDokumenById(id);
    if (!existing) {
      throw new Error('Jenis dokumen tidak ditemukan!');
    }
    return await masterRepository.deleteJenisDokumen(id);
  }
}

module.exports = new MasterService();
