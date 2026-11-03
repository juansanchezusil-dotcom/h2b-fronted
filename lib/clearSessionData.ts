// Al cerrar sesión se borra del navegador lo que la persona escribió (su práctica de entrevista a medias), por si el
// celular o la computadora es compartida. Los pasos del mapa no se tocan: solo son marcas y también están en la base.
export function clearSessionData() {
  try {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith('jta-sim-'))
      .forEach((key) => window.localStorage.removeItem(key))
  } catch {
    // Sin almacenamiento no hay nada que borrar
  }
}
