export const getAnalysis = (sys, dia, userHistory) => {
  let medicalLabel = "Normal";
  let medicalColor = "#22c55e"; 

  // Medical Logic
  if (sys >= 180 || dia >= 120) {
    medicalLabel = "CRISIS! Seek Medical Help";
    medicalColor = "#ef4444"; 
  } else if (sys >= 140 || dia >= 90) {
    medicalLabel = "High (Stage 2) - Seek Doctor";
    medicalColor = "#f97316"; 
  } else if (sys >= 130 || dia >= 80) {
    medicalLabel = "High (Stage 1)";
    medicalColor = "#eab308"; 
  } else if (sys >= 120 && dia < 80) {
    medicalLabel = "Elevated";
    medicalColor = "#84cc16"; 
  }

  // Sensor Error (Physical Limits)
  if (sys > 300 || dia < 20 || sys < 40 || (sys - dia) < 15) {
    return { 
      msg: "⚠️ SENSOR ERROR: Values outside human limits", 
      medical: "Invalid Reading - Retest",
      color: "#f59e0b", 
      type: "sensor_error"
    };
  }

  // Security Attack (Statistical Anomaly)
  if (userHistory.length >= 3) {
    const mean = userHistory.reduce((a, b) => a + b.systolic, 0) / userHistory.length;
    const variance = userHistory.reduce((a, b) => a + Math.pow(b.systolic - mean, 2), 0) / userHistory.length;
    const stdDev = Math.sqrt(variance);
    const zScore = Math.abs(sys - mean) / (stdDev || 1);

    if (zScore > 3.5) {
      return { 
        msg: "🚨 SECURITY ALERT: Possible Data Attack", 
        medical: "Anomalous Spike Detected",
        color: "#7f1d1d", 
        type: "attack"
      };
    }
  }

  return { 
    msg: "Verified: Original Data", 
    medical: medicalLabel,
    color: medicalColor,
    type: "original"
  };
};
