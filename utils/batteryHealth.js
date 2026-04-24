const estimateBatteryHealth = ({
  originalRangeKm,
  currentRangeKm,
  vehicleAgeYears,
  mileageKm,
}) => {
  // 🔹 Range factor (50%)
  const rangeRatio =
    originalRangeKm > 0 ? currentRangeKm / originalRangeKm : 1;

  const rangeScore = Math.min(100, Math.max(0, rangeRatio * 100));

  // 🔹 Age factor (25%)
  const expectedAgeDegradation = vehicleAgeYears * 2;
  const ageScore = Math.max(0, 100 - expectedAgeDegradation);

  // 🔹 Mileage factor (25%)
  const mileageDegradation = (mileageKm / 10000) * 0.5;
  const mileageScore = Math.max(0, 100 - mileageDegradation);

  // 🔹 Final score
  let healthScore = Math.floor(
    rangeScore * 0.5 +
      ageScore * 0.25 +
      mileageScore * 0.25
  );

  healthScore = Math.min(100, Math.max(0, healthScore));

  // 🔹 Degradation %
  const degradationPercent = Number(
    (100 - healthScore).toFixed(1)
  );

  // 🔹 Status + Recommendation
  let status, recommendation;

  if (healthScore >= 90) {
    status = "excellent";
    recommendation =
      "Battery is in excellent condition. Expected to perform like new.";
  } else if (healthScore >= 75) {
    status = "good";
    recommendation =
      "Battery is in good condition. Normal wear for this age and usage.";
  } else if (healthScore >= 60) {
    status = "fair";
    recommendation =
      "Battery shows moderate degradation. Consider professional inspection.";
  } else {
    status = "poor";
    recommendation =
      "Battery has significant degradation. Replacement may be needed soon.";
  }

  return {
    healthScore,
    healthStatus: status,
    estimatedDegradationPercent: degradationPercent,
    recommendation,
    factors: {
      rangeScore: Number(rangeScore.toFixed(1)),
      ageScore: Number(ageScore.toFixed(1)),
      mileageScore: Number(mileageScore.toFixed(1)),
    },
  };
};

module.exports = estimateBatteryHealth;