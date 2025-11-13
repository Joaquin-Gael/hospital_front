export interface HeroData {
  backgroundImage: string;
  altText?: string;
  title?: string;
  subtitle?: string;
  highlightText?: string;
  badge?: string;
  description?: string;
  primaryButtonText?: string;
  primaryButtonIcon?: string;
  secondaryButtonText?: string;
  secondaryButtonIcon?: string;
  certifications?: Array<{
    icon? : string;
    text?: string;
  }>;
  floatingCards?: Array<{
    icon?: string;
    text?: string;
    position?: 'card-1' | 'card-2' | 'card-3';
  }>;
}

export interface Department {
  id: number;
  name: string;
  description: string;
  icon: string;
}

export interface Doctor {
  id: number;
  name: string;
  specialty: string;
  description: string;
  rating: number;
  avatar: string;
}

export interface Service {
  id: number;
  name: string;
  icon: string;
  description: string;
}

export interface FAQ {
  id: number;
  question: string;
  answer: string;
  isOpen: boolean;
}

export interface Specialty {
  id: number;
  name: string;
  icon: string;
  description: string;
}

export interface News {
  id: number;
  title: string;
  date: string;
  summary: string;
  image: string;
}

export interface Stat {
  value: string;
  label: string;
  icon: string;
}