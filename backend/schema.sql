-- ====================================================================
-- SKEMA DATABASE SIPANDU (SISTEM PENGELOLAAN & MONITORING DOKUMEN PEMBAYARAN)
-- PostgreSQL DDL Script
-- ====================================================================

-- 1. Tabel Users & Authentication (Login menggunakan Email)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- SHA-256 salted encrypted hash
    full_name VARCHAR(100) NOT NULL,
    nip VARCHAR(30), -- Optional
    role VARCHAR(30) NOT NULL CHECK (role IN ('biro_01', 'ppk', 'superadmin')),
    unit_kerja VARCHAR(100), -- Optional
    phone VARCHAR(20), -- Optional
    avatar_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Dokumen Pembayaran
CREATE TABLE IF NOT EXISTS payment_documents (
    id SERIAL PRIMARY KEY,
    nomor_surat VARCHAR(100) UNIQUE NOT NULL,
    nomor_agenda VARCHAR(100),
    nama_kegiatan VARCHAR(255) NOT NULL,
    kategori VARCHAR(50) DEFAULT 'LS-Kontraktual',
    ppk_name VARCHAR(100) NOT NULL,
    unit_kerja VARCHAR(100) NOT NULL,
    nilai_pembayaran NUMERIC(18, 2) NOT NULL DEFAULT 0,
    tanggal_pengajuan DATE NOT NULL DEFAULT CURRENT_DATE,
    
    jenis_dokumen VARCHAR(100),
    perihal VARCHAR(255),
    tanggal_dokumen DATE,
    tanggal_diterima DATE DEFAULT CURRENT_DATE,
    pihak_eksternal VARCHAR(150),
    keterangan TEXT,

    status VARCHAR(50) NOT NULL DEFAULT 'menunggu_verifikasi',
    catatan_revisi TEXT,
    catatan_verifikasi TEXT,
    tanggal_verifikasi TIMESTAMP WITH TIME ZONE,
    verified_by_id INT REFERENCES users(id) ON DELETE SET NULL,
    
    legend_status VARCHAR(50) DEFAULT 'Menunggu Verifikasi',
    legend_color VARCHAR(30) DEFAULT 'amber',
    
    created_by_id INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Dokumen Pendukung (Attachments)
CREATE TABLE IF NOT EXISTS document_attachments (
    id SERIAL PRIMARY KEY,
    document_id INT NOT NULL REFERENCES payment_documents(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100),
    document_type VARCHAR(100) DEFAULT 'Dokumen Pendukung',
    nomor_dokumen VARCHAR(100),
    tanggal_dokumen DATE,
    uploaded_by_id INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Audit Trail (Log Perubahan Status)
CREATE TABLE IF NOT EXISTS audit_trails (
    id SERIAL PRIMARY KEY,
    document_id INT REFERENCES payment_documents(id) ON DELETE SET NULL,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(100) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabel Notifikasi (Untuk Biro 01 & PPK)
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    document_id INT REFERENCES payment_documents(id) ON DELETE CASCADE,
    nomor_surat VARCHAR(100) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'new_submission', 'resubmission', 'approved', 'rejected'
    target_role VARCHAR(30) NOT NULL, -- 'biro_01', 'ppk', 'all'
    target_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_payment_documents_status ON payment_documents(status);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_trails(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attachments_doc_id ON document_attachments(document_id);
CREATE INDEX IF NOT EXISTS idx_notifications_role ON notifications(target_role, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
