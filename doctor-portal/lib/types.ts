export interface Patient {
  id: string;
  name: string;
  email: string;
  createdAt: any;
  profileImage?: string;
}

export interface Note {
  id: string;
  userId: string;
  content: string;
  mood?: string;
  createdAt: any;
}

export interface Doctor {
  id: string;
  email: string;
  name: string;
  patients: string[];
}
