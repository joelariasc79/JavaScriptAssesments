export interface AuthResponse {
  message: string;
  token: string;
  user: {
    userId: string;
    username: string;
    name: string;
    role: string;
    hospitalIds: string[];
  };
}
