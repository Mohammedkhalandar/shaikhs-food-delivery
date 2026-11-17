export function imageHosts() {
  return (process.env.MENU_IMAGE_HOSTS ?? "").split(",").map(host => host.trim().toLowerCase()).filter(host => /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/.test(host));
}
export function safeImageUrl(value: string | null) {
  if (!value) return null;
  if (/^\/api\/menu-images\/[a-z0-9]{20,40}$/.test(value)) return value;
  if (/^\/images\/[a-z0-9-]+\.(jpg|jpeg|png|webp)$/.test(value)) return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.port && imageHosts().includes(url.hostname.toLowerCase()) ? url.toString() : null;
  } catch { return null; }
}
