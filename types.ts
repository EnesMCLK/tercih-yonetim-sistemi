export interface User {
  sicilNo: string;
  fullName: string;
  passwordHash: string; // Will store SHA-256 hash
  salt: string; // Salt for key derivation
  securityQuestion: string;
  securityAnswerHash: string;
}

export interface Preference {
  id: string;
  name: string;
}