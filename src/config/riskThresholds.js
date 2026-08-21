// Configurable risk thresholds for biometrics and health assessment evaluations
module.exports = {
  BLOOD_PRESSURE: {
    SYSTOLIC_MAX: 140, // mmHg -> >140 flags risk
    SYSTOLIC_MIN: 90,
    DIASTOLIC_MAX: 90, // mmHg -> >90 flags risk
    DIASTOLIC_MIN: 60,
  },
  HEART_RATE: {
    MAX: 100, // bpm -> >100 flags risk (tachycardia)
    MIN: 45,  // bpm -> <45 flags risk (bradycardia)
  },
  WEIGHT: {
    MAX_KG: 200,
    MIN_KG: 30,
  },
  HEIGHT: {
    MAX_CM: 250,
    MIN_CM: 50,
  },
  RISK_KEYWORDS: [
    'cardiac',
    'heart disease',
    'hypertension',
    'chest pain',
    'arrhythmia',
    'stroke',
    'diabetes',
    'asthma',
    'epilepsy',
    'surgery',
  ],
  ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET || 'fitness_wellness_default_secret_key_32chars!',
};
