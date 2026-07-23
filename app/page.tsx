import { getJobs, getEmployers } from '@/services/api';

export default async function HomePage() {
  const jobs = await getJobs();
  const employers = await getEmployers();

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="border-b pb-4">
          <h1 className="text-3xl font-bold text-gray-900">Portal H-2B</h1>
          <p className="text-gray-600">Visualizador de trabajos y empleadores</p>
        </header>

        {/* Sección de Trabajos */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Trabajos Disponibles</h2>
          {jobs.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <p className="text-gray-500">No hay trabajos cargados aún.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">{job.title || 'Puesto Sin Título'}</h3>
                  <p className="text-sm text-gray-600">{job.employer_name || 'Empleador no especificado'}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Sección de Empleadores */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Empleadores Registrados</h2>
          {employers.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <p className="text-gray-500">No hay empleadores registrados aún.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {employers.map((employer) => (
                <div key={employer.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">{employer.name}</h3>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}