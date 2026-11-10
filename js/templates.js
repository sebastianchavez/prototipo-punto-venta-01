/**
 * Completa una plantilla HTML incluida en el documento actual.
 * Los marcadores {{ nombre }} reciben valores calculados por los controladores.
 * No se evalúa código: el contenido variable de usuarios se escapa en ui.js.
 */
export function renderTemplate(id, values = {}) {
  const template = document.getElementById(id);
  if (!template) {
    throw new Error(`No se encontró la plantilla HTML: ${id}.`);
  }

  return template.textContent.replace(/\{\{\s*([\w-]+)\s*\}\}/g, (_, name) => {
    if (!Object.hasOwn(values, name)) {
      throw new Error(`Falta el valor "${name}" en la plantilla ${id}.`);
    }
    return String(values[name] ?? '');
  });
}
