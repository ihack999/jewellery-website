export function stepDampedSway(angle, velocity, acceleration, seconds, frequency = 1, limit = 0.32) {
  const duration = Math.max(0, Math.min(0.1, seconds));
  const natural = Math.PI * 2 * frequency;
  const damping = natural * 0.7;
  const oscillation = natural * Math.sqrt(1 - 0.7 ** 2);
  const equilibrium = acceleration / natural ** 2;
  const relative = angle - equilibrium;
  const coefficient = (velocity + damping * relative) / oscillation;
  const cosine = Math.cos(oscillation * duration);
  const sine = Math.sin(oscillation * duration);
  const decay = Math.exp(-damping * duration);
  const offset = relative * cosine + coefficient * sine;
  const nextAngle = equilibrium + decay * offset;
  let nextVelocity = decay * (-damping * offset - relative * oscillation * sine + coefficient * oscillation * cosine);
  const bounded = Math.max(-limit, Math.min(limit, nextAngle));
  if (bounded !== nextAngle && nextVelocity * nextAngle > 0) nextVelocity = 0;
  return { angle: bounded, velocity: nextVelocity };
}
