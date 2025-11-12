import { Department, Doctor, News, FAQ, Specialty, Stat, HeroData } from '../models/interfaces';

export const HERO: HeroData = {
  backgroundImage: 'assets/hero.png',
  altText: 'Hospital SDLG - Centro Médico de Excelencia',
  title: 'Hospital SDLG',
  subtitle: '',
  highlightText: 'Centro Médico de Excelencia',
  badge: 'Centro Médico de Excelencia',
  description: 'Comprometidos con tu salud y bienestar con atención médica de calidad y tecnología avanzada',
  primaryButtonText: 'Agendar Cita',
  primaryButtonIcon: 'event',
  secondaryButtonText: 'Contacto de Emergencia',
  secondaryButtonIcon: 'phone',
  certifications: [
    {
      icon: 'verified',
      text: 'Acreditación JCI'
    },
    {
      icon: 'verified',
      text: 'ISO 9001'
    },
    {
      icon: 'verified',
      text: 'Hospital Universitario'
    }
  ],
  floatingCards: [
    {
      icon: 'medical_services',
      text: 'Atención 24/7',
      position: 'card-1'
    },
    {
      icon: 'health_and_safety',
      text: 'Excelencia Médica',
      position: 'card-2'
    },
    {
      icon: 'healing',
      text: 'Tecnología Avanzada',
      position: 'card-3'
    }
  ]
};

export const DEPARTMENTS: Department[] = [
  {
    id: 1,
    name: "Emergencias",
    description: "Atención inmediata las 24 horas para situaciones críticas con equipamiento de última generación.",
    icon: "emergency",
  },
  {
    id: 2,
    name: "Consulta Externa",
    description: "Atención programada con especialistas en todas las áreas médicas.",
    icon: "medical_services",
  },
  {
    id: 3,
    name: "Diagnóstico por Imágenes",
    description: "Tecnología avanzada para diagnósticos precisos: resonancia, tomografía y ecografía.",
    icon: "radio",
  },
  {
    id: 4,
    name: "Laboratorio Clínico",
    description: "Análisis clínicos con resultados rápidos y precisos disponibles en nuestra plataforma digital.",
    icon: "biotech",
  },
  {
    id: 5,
    name: "Cirugía",
    description: "Quirófanos equipados con tecnología de vanguardia y equipo médico especializado.",
    icon: "monitor_heart",
  },
  {
    id: 6,
    name: "Hospitalización",
    description: "Habitaciones confortables con atención personalizada para una recuperación óptima.",
    icon: "hotel",
  },
];

export const DOCTORS: Doctor[] = [
  {
    id: 1,
    name: "Dra. María Rodríguez",
    specialty: "Cardiología",
    description:
      "Especialista en cardiología intervencionista con más de 15 años de experiencia. Formada en la Universidad de Barcelona y con fellowship en la Clínica Mayo.",
    rating: 5,
    avatar: "person",
  },
  {
    id: 2,
    name: "Dr. Carlos Méndez",
    specialty: "Neurología",
    description:
      "Neurólogo especializado en trastornos del movimiento y enfermedades neurodegenerativas. Investigador principal en estudios sobre Parkinson.",
    rating: 5,
    avatar: "person",
  },
  {
    id: 3,
    name: "Dra. Laura Sánchez",
    specialty: "Pediatría",
    description:
      "Pediatra con especialidad en neonatología. Dedicada al cuidado integral de niños desde recién nacidos hasta la adolescencia.",
    rating: 5,
    avatar: "person",
  },
];

export const NEWS: News[] = [
  {
    id: 1,
    title: "Nuevo Centro de Oncología",
    date: "15 de abril, 2023",
    summary:
      "Inauguramos nuestro nuevo Centro de Oncología Integral con tecnología de vanguardia para tratamientos personalizados.",
    image: "oncology",
  },
  {
    id: 2,
    title: "Campaña de Vacunación",
    date: "3 de mayo, 2023",
    summary: "Iniciamos campaña de vacunación gratuita para niños menores de 5 años en todas nuestras sedes.",
    image: "vaccine",
  },
  {
    id: 3,
    title: "Reconocimiento Internacional",
    date: "20 de junio, 2023",
    summary:
      "Hospital SDLG recibe acreditación internacional por excelencia en seguridad del paciente y calidad asistencial.",
    image: "award",
  },
];

export const FAQS: FAQ[] = [
  {
    id: 1,
    question: "¿Cómo puedo solicitar una cita médica?",
    answer:
      "Puede solicitar su cita a través de nuestra plataforma web, aplicación móvil o llamando a nuestro centro de contacto al (01) 555-7890. También puede acercarse personalmente a nuestros módulos de atención.",
    isOpen: false,
  },
  {
    id: 2,
    question: "¿Qué seguros médicos aceptan?",
    answer:
      "Trabajamos con las principales aseguradoras nacionales e internacionales. Entre ellas: Seguro Nacional de Salud, MediSalud, GlobalHealth, Sanitas y otras. Puede verificar la cobertura específica llamando a nuestro departamento de seguros.",
    isOpen: false,
  },
  {
    id: 3,
    question: "¿Cuál es el horario de visitas para pacientes hospitalizados?",
    answer:
      "El horario general de visitas es de 11:00 a 20:00 horas. Para unidades especiales como UCI y Neonatología, los horarios son restringidos y se informan directamente a los familiares del paciente.",
    isOpen: false,
  },
  {
    id: 4,
    question: "¿Cómo puedo acceder a mis resultados de laboratorio?",
    answer:
      "Los resultados están disponibles en nuestra plataforma digital. Puede acceder con su número de documento y el código proporcionado al momento de realizarse los análisis. También puede recogerlos personalmente presentando su identificación.",
    isOpen: false,
  },
  {
    id: 5,
    question: "¿Ofrecen servicio de emergencias las 24 horas?",
    answer:
      "Sí, nuestro servicio de emergencias está disponible las 24 horas del día, los 365 días del año, con médicos especialistas de guardia y equipamiento completo para atender cualquier urgencia médica.",
    isOpen: false,
  },
];

export const SPECIALTIES: Specialty[] = [
  {
    id: 1,
    name: "Cardiología",
    icon: "favorite",
    description: "Diagnóstico y tratamiento de enfermedades cardiovasculares con tecnología de vanguardia.",
  },
  {
    id: 2,
    name: "Pediatría",
    icon: "child_care",
    description: "Atención especializada para niños y adolescentes con enfoque preventivo y terapéutico.",
  },
  {
    id: 3,
    name: "Traumatología",
    icon: "healing",
    description: "Tratamiento de lesiones óseas, articulares y musculares con técnicas mínimamente invasivas.",
  },
  {
    id: 4,
    name: "Oncología",
    icon: "medication",
    description: "Tratamientos integrales y personalizados contra el cáncer con enfoque multidisciplinario.",
  },
  {
    id: 5,
    name: "Neurología",
    icon: "psychology",
    description: "Diagnóstico y tratamiento de trastornos del sistema nervioso central y periférico.",
  },
  {
    id: 6,
    name: "Ginecología",
    icon: "pregnant_woman",
    description: "Atención integral de la salud femenina en todas las etapas de la vida.",
  },
];

export const STATS: Stat[] = [
  { value: "+200", label: "Médicos Especialistas", icon: "people" },
  { value: "+50", label: "Especialidades Médicas", icon: "medical_services" },
  { value: "+30", label: "Años de Experiencia", icon: "history" },
  { value: "+100K", label: "Pacientes Atendidos", icon: "groups" },
];