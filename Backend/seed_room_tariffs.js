const pool = require('./db');

const initialRoomTariffs = [
  { label: 'General Ward - ಜನರಲ್ ವಾರ್ಡ್', tariff: '2000' },
  { label: 'Semi Private - ಸೆಮಿ ಪ್ರೈವೇಟ್', tariff: '2500' },
  { label: 'Private - ಪ್ರೈವೇಟ್', tariff: '3500' },
  { label: 'Deluxe Suite - ಡಿಲಕ್ಸ್ ಸೂಟ್', tariff: '5500' },
  { label: 'ICU - ಐಸಿಯು', tariff: '5500' },
  { label: 'Ventilator Charge - ವೆಂಟಿಲೇಟರ್ ಶುಲ್ಕ', tariff: '6000' },
  { label: 'NICU charge - ಎನ್‌ಐಸಿಯು ಶುಲ್ಕ', tariff: '5600' },
  { label: 'NICU Ventilator charge - ಎನ್‌ಐಸಿಯು ವೆಂಟಿಲೇಟರ್ ಶುಲ್ಕ', tariff: '6000' }
];

async function seedRoomTariffs() {
  try {
    for (const item of initialRoomTariffs) {
      const check = await pool.query(
        `SELECT id FROM patient_register_master WHERE category = 'Room Tariff' AND label = $1`,
        [item.label]
      );
      if (check.rows.length === 0) {
        await pool.query(
          `INSERT INTO patient_register_master (category, label, status, tariff) VALUES ('Room Tariff', $1, 'Active', $2)`,
          [item.label, item.tariff]
        );
        console.log(`Seeded room tariff: ${item.label} (${item.tariff})`);
      }
    }
    console.log('Finished seeding room tariffs.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding room tariffs:', err.message);
    process.exit(0);
  }
}

seedRoomTariffs();
