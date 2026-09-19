export interface User {
  _id: string;
  userId: string;
  name: string;
  phone: string;
  hamlet: string;
  shgName: string;
  shg_name: string;
  role: string;
  approved?: boolean;
  houseNo?: string;
  street?: string;
  hamletId?: string;
  streetId?: string;
}

export const HAMLETS = [
  "கோணாங்கிபட்டி குக்கிராமம்",
  "காட்டூர் குக்கிராமம்",
];

export const HAMLET_STREETS: Record<string, string[]> = {
  "கோணாங்கிபட்டி குக்கிராமம்": ["வடக்கு தெரு", "கிழக்கு தெரு", "அம்பேத்கர் தெரு", "தெற்கு தெரு"],
  "காட்டூர் குக்கிராமம்": ["மேற்கு கல்லாங்குத்து தெரு", "காட்டூர் அரச மர தெரு", "காட்டூர் அங்கன் வாடி தெரு"],
};

export function getToken(): string {
  return localStorage.getItem("token") || "";
}

export function getUser(): User | null {
  const data = localStorage.getItem("user");
  return data ? JSON.parse(data) : null;
}

export function setUser(user: User, token: string) {
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("token", token);
}

export function clearUser() {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
}
