export interface Job {
  id: string;
  title: string;
  employer_name: string;
  location?: string;
  created_at: string;
  [key: string]: any;
}

export interface Employer {
  id: string;
  name: string;
  [key: string]: any;
}

const API_BASE_URL = '';

export async function getJobs(): Promise<Job[]> {
  try {
    const res = await fetch('/api/jobs', { cache: 'no-store' });

    if (!res.ok) throw new Error('Error al obtener trabajos');
    return await res.json();
  } catch (error) {
    console.error('Error cargando trabajos:', error);
    return [];
  }
}

export async function getEmployers(): Promise<Employer[]> {
  try {
    const res = await fetch('/api/employers', { cache: 'no-store' });

    if (!res.ok) throw new Error('Error al obtener empleadores');
    return await res.json();
  } catch (error) {
    console.error('Error conectando con la API:', error);
    return [];
  }
}
