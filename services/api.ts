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

const API_BASE_URL = 'https://h2b-backend-three.vercel.app/api';

export async function getJobs(): Promise<Job[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/jobs`);
    if (!res.ok) throw new Error('Error al obtener trabajos');
    return await res.json();
  } catch (error) {
    console.error('getJobs error:', error);
    return [];
  }
}

export async function getEmployers(): Promise<Employer[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/employers`);
    if (!res.ok) throw new Error('Error al obtener empleadores');
    return await res.json();
  } catch (error) {
    console.error('getEmployers error:', error);
    return [];
  }
}