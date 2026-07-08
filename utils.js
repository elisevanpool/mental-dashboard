function moodLabel(value) {
  if (value <= 10) return ["Crisis", "😭"];
  if (value <= 20) return ["Panic", "😰"];
  if (value <= 35) return ["Distressed", "😟"];
  if (value <= 45) return ["Low", "🙁"];
  if (value <= 55) return ["Baseline", "😐"];
  if (value <= 70) return ["Calm", "🙂"];
  if (value <= 85) return ["Happy", "😄"];
  return ["Amazing", "🤩"];
}