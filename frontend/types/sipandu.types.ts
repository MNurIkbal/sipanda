export interface User {
  id: number;
  email: string;
  full_name: string;
  nip?: string;
  role: 'biro_01' | 'ppk' | 'superadmin';
  unit_kerja?: string;
  phone?: string;
  avatar_url?: string;
  is_active?: boolean;
}

export interface Attachment {
  id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type?: string;
  document_type?: string;
  nomor_dokumen?: string;
  tanggal_dokumen?: string | null;
}

export interface PaymentDocument {
  id: number;
  nomor_surat: string;
  nomor_agenda?: string;
  nama_kegiatan: string;
  kategori: string;
  ppk_name: string;
  unit_kerja: string;
  nilai_pembayaran: number;
  tanggal_pengajuan: string;

  // New fields matching the user's screenshot
  jenis_dokumen?: string;
  perihal?: string;
  tanggal_dokumen?: string | null;
  tanggal_diterima?: string;
  pihak_eksternal?: string;
  keterangan?: string;

  status: string;
  catatan_revisi?: string;
  catatan_verifikasi?: string;
  tanggal_verifikasi?: string | null;
  verified_by_name?: string | null;
  legend_status: string;
  legend_color: string;
  attachments: Attachment[];
  created_at?: string;
  updated_at?: string;
}

export interface AuditTrail {
  id: number;
  document_id?: number | null;
  nomor_surat?: string;
  user_name: string;
  user_role: string;
  action: string;
  description: string;
  previous_status?: string | null;
  new_status?: string | null;
  created_at: string;
}
