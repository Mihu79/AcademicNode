export interface Member {
  id: number;
  username: string;
  photoUrl: string;
  age: number;
  knownAs: string;
  created: Date;
  lastActive: Date;
  gender: string;
  introduction: string;
  city: string;
  country: string;
  educations: Education[];
  experiences: Experience[];
  projects: Project[];
  certifications: Certification[];
}
export interface Education {
  id: number;
  school: string;
  degree: string;
  fieldOfStudy: string;
  startDate: Date;
  endDate?: Date;
}

export interface Experience {
  id: number;
  company: string;
  position: string;
  description: string;
  startDate: Date;
  endDate?: Date;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  githubLink: string;
  startDate: Date;
  endDate?: Date;
}

export interface Certification {
  id: number;
  name: string;
  issuer: string;
  dateIssued: Date;
}
