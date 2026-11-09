export function localDate(value) {
  return new Intl.DateTimeFormat("es-EC", {
    dateStyle: "medium",
    timeZone: "America/Guayaquil",
  }).format(new Date(value));
}
