const healthService = require('./healthService');

class RecommendationService {
  async getPersonalizedPlan(memberId) {
    const logs = await healthService.getMemberHealthLogs(memberId);
    const assessment = logs.assessment || {};
    const metrics = logs.metrics || [];

    // Extract latest metrics or fallback to default baselines
    const latestMetric = metrics.length > 0 ? metrics[0] : {};
    const weightKg = parseFloat(latestMetric.weight_kg) || 72.0;
    const systolic = latestMetric.systolic_bp || 120;
    const diastolic = latestMetric.diastolic_bp || 80;
    const heartRate = latestMetric.heart_rate || 72;

    const fitnessGoals = (assessment.fitness_goals || 'General Fitness & Stamina').toLowerCase();
    const isRiskFlagged = assessment.risk_flagged || latestMetric.risk_flagged || systolic > 140 || diastolic > 90;

    // Calculate BMR (Mifflin-St Jeor estimate with baseline)
    let bmr = 10 * weightKg + 6.25 * 175 - 5 * 28 + 5;
    let activityMultiplier = 1.35; // moderate activity

    if (fitnessGoals.includes('weight loss') || fitnessGoals.includes('burn fat') || fitnessGoals.includes('slim')) {
      activityMultiplier = 1.25;
    } else if (fitnessGoals.includes('muscle') || fitnessGoals.includes('strength') || fitnessGoals.includes('hypertrophy')) {
      activityMultiplier = 1.45;
    } else if (fitnessGoals.includes('endurance') || fitnessGoals.includes('stamina') || fitnessGoals.includes('cardio')) {
      activityMultiplier = 1.5;
    }

    let targetCalories = Math.round(bmr * activityMultiplier);

    // Adjust target based on goal
    if (fitnessGoals.includes('weight loss') || fitnessGoals.includes('burn fat')) {
      targetCalories -= 350;
    } else if (fitnessGoals.includes('muscle') || fitnessGoals.includes('strength')) {
      targetCalories += 300;
    }

    // Macro Split Calculation (Grams & %)
    const proteinGrams = Math.round(weightKg * (fitnessGoals.includes('muscle') ? 2.0 : 1.8));
    const proteinCalories = proteinGrams * 4;
    
    let fatCalories = Math.round(targetCalories * 0.25);
    const fatGrams = Math.round(fatCalories / 9);

    let carbCalories = targetCalories - proteinCalories - fatCalories;
    if (carbCalories < 400) carbCalories = 400;
    const carbGrams = Math.round(carbCalories / 4);

    const waterLiters = (weightKg * 0.035).toFixed(1);

    // Recommended Workout Split
    let workoutSplit = [];
    let precautions = [];

    if (isRiskFlagged) {
      workoutSplit = [
        { day: 'Mon', focus: 'Low-Impact Cardio (Stationary Bike)', duration: '30 mins', intensity: 'Zone 2 (Light)' },
        { day: 'Tue', focus: 'Active Recovery & Core Stability', duration: '25 mins', intensity: 'Low' },
        { day: 'Wed', focus: 'Supervised Light Resistance', duration: '35 mins', intensity: 'Moderate' },
        { day: 'Thu', focus: 'Rest & Guided Breathing', duration: '-', intensity: 'Rest' },
        { day: 'Fri', focus: 'Guided Hydrotherapy / Swimming', duration: '30 mins', intensity: 'Low-Moderate' },
        { day: 'Sat/Sun', focus: 'Light Outdoor Walking & Mobility', duration: '40 mins', intensity: 'Light' }
      ];
      precautions.push('⚠️ Elevated Blood Pressure/Health Flag detected. Avoid 1-Rep Max heavy straining & intense HIIT until cleared by Health Consultant.');
      precautions.push('🩺 Keep Heart Rate below 145 bpm during sessions.');
    } else if (fitnessGoals.includes('muscle') || fitnessGoals.includes('strength')) {
      workoutSplit = [
        { day: 'Mon', focus: 'Upper Body Hypertrophy (Chest & Back)', duration: '50 mins', intensity: 'High' },
        { day: 'Tue', focus: 'Lower Body Power (Squats & Deadlifts)', duration: '50 mins', intensity: 'High' },
        { day: 'Wed', focus: 'Active Recovery & Core Stretch', duration: '30 mins', intensity: 'Low' },
        { day: 'Thu', focus: 'Push Focus (Shoulders, Triceps, Chest)', duration: '45 mins', intensity: 'Moderate-High' },
        { day: 'Fri', focus: 'Pull Focus (Lats, Biceps, Rear Delts)', duration: '45 mins', intensity: 'Moderate-High' },
        { day: 'Sat', focus: 'Legs & Conditioning Finisher', duration: '40 mins', intensity: 'High' },
        { day: 'Sun', focus: 'Rest Day', duration: '-', intensity: 'Rest' }
      ];
      precautions.push('Ensure 8 hours of sleep and adequate post-workout protein within 60 mins.');
    } else {
      workoutSplit = [
        { day: 'Mon', focus: 'Full Body Circuit & HIIT', duration: '40 mins', intensity: 'High' },
        { day: 'Tue', focus: 'Zone 2 Cardio & Core', duration: '45 mins', intensity: 'Moderate' },
        { day: 'Wed', focus: 'Mobility & Foam Rolling', duration: '30 mins', intensity: 'Low' },
        { day: 'Thu', focus: 'Hypertrophy Strength Circuit', duration: '45 mins', intensity: 'Moderate-High' },
        { day: 'Fri', focus: 'Endurance Cardio & Intervals', duration: '40 mins', intensity: 'High' },
        { day: 'Sat/Sun', focus: 'Outdoor Activity / Rest', duration: '60 mins', intensity: 'Moderate' }
      ];
      precautions.push('Hydrate with electro-enhanced water during long workout sessions.');
    }

    return {
      memberId,
      fitnessGoals: assessment.fitness_goals || 'General Fitness',
      isRiskFlagged,
      weightKg,
      nutrition: {
        dailyCalories: targetCalories,
        waterLiters: parseFloat(waterLiters),
        macros: {
          protein: { grams: proteinGrams, calories: proteinCalories, percent: Math.round((proteinCalories / targetCalories) * 100) },
          carbs: { grams: carbGrams, calories: carbCalories, percent: Math.round((carbCalories / targetCalories) * 100) },
          fats: { grams: fatGrams, calories: fatCalories, percent: Math.round((fatCalories / targetCalories) * 100) }
        },
        recommendedMealPlan: [
          { meal: 'Breakfast', title: 'High-Protein Oats & Berry Bowl', desc: 'Oats, whey protein isolate, blueberries, chia seeds, almond milk' },
          { meal: 'Lunch', title: 'Grilled Chicken & Quinoa Energy Bowl', desc: 'Breast chicken, quinoa, roasted veggies, avocado, olive oil dressing' },
          { meal: 'Snack', title: 'Greek Yogurt & Almond Crunch', desc: 'Low-fat Greek yogurt, honey, raw almonds, sliced apples' },
          { meal: 'Dinner', title: 'Baked Salmon & Asparagus Medley', desc: 'Wild salmon fillet, grilled asparagus, sweet potato mash' }
        ]
      },
      workoutPlan: {
        targetWeeklySessions: 4,
        schedule: workoutSplit
      },
      precautions
    };
  }
}

module.exports = new RecommendationService();
