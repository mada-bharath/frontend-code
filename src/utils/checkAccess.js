export const isCourseActive = (expiresAt) => {
  return new Date() < new Date(expiresAt);
};