const pool = require('../db');

class FormHeaderMasterModel {
  static async getHeader() {
    try {
      const query = 'SELECT * FROM form_header_master ORDER BY is_default DESC, id DESC LIMIT 1;';
      const { rows } = await pool.query(query);
      return rows[0] || null;
    } catch (err) {
      console.warn('DB getHeader warning:', err.message);
      return null;
    }
  }

  static async createOrUpdate(data) {
    try {
      const {
        hospitalCode, hospitalName,
        branchCode, branchName, branchAddress, areaName,
        subTitle, tagline, regNo,
        logoText, logoUrl,
        phone, whatsapp, whatsappEnabled,
        email, website,
        addressLine1, addressLine2,
        headerStyle, status,
        fieldFonts,
      } = data;

      const existing = await this.getHeader();

      const fieldFontsJson = fieldFonts ? JSON.stringify(fieldFonts) : null;

      if (existing && existing.id) {
        const query = `
          UPDATE form_header_master
          SET hospital_code      = $1,
              hospital_name      = $2,
              branch_code        = $3,
              branch_name        = $4,
              branch_address     = $5,
              area_name          = $6,
              sub_title          = $7,
              tagline            = $8,
              reg_no             = $9,
              logo_text          = $10,
              logo_url           = $11,
              phone              = $12,
              whatsapp           = $13,
              whatsapp_enabled   = $14,
              email              = $15,
              website            = $16,
              address_line1      = $17,
              address_line2      = $18,
              header_style       = $19,
              status             = $20,
              field_fonts        = $21
          WHERE id = $22
          RETURNING *;
        `;
        const values = [
          hospitalCode || '',
          hospitalName || 'GURUSHREE',
          branchCode || '',
          branchName || '',
          branchAddress || '',
          areaName || '',
          subTitle || 'HI-TECH MULTI SPECIALITY HOSPITAL',
          tagline || 'A touch can instill faith',
          regNo || '',
          logoText || 'GS',
          logoUrl || '',
          phone || '',
          whatsapp || '',
          whatsappEnabled !== false,
          email || '',
          website || '',
          addressLine1 || '',
          addressLine2 || '',
          headerStyle || 'Center',
          status || 'Active',
          fieldFontsJson,
          existing.id,
        ];
        const { rows } = await pool.query(query, values);
        return rows[0];
      } else {
        const query = `
          INSERT INTO form_header_master (
            hospital_code, hospital_name,
            branch_code, branch_name, branch_address, area_name,
            sub_title, tagline, reg_no,
            logo_text, logo_url,
            phone, whatsapp, whatsapp_enabled,
            email, website,
            address_line1, address_line2,
            header_style, status, field_fonts
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
          RETURNING *;
        `;
        const values = [
          hospitalCode || '',
          hospitalName || 'GURUSHREE',
          branchCode || '',
          branchName || '',
          branchAddress || '',
          areaName || '',
          subTitle || 'HI-TECH MULTI SPECIALITY HOSPITAL',
          tagline || 'A touch can instill faith',
          regNo || '',
          logoText || 'GS',
          logoUrl || '',
          phone || '',
          whatsapp || '',
          whatsappEnabled !== false,
          email || '',
          website || '',
          addressLine1 || '',
          addressLine2 || '',
          headerStyle || 'Center',
          status || 'Active',
          fieldFontsJson,
        ];
        const { rows } = await pool.query(query, values);
        return rows[0];
      }
    } catch (err) {
      console.warn('DB createOrUpdate FormHeader warning:', err.message);
      return data;
    }
  }
}

module.exports = FormHeaderMasterModel;
