/**
 * Normalises a raw district string returned by any geocoding provider
 * into the canonical district names used throughout the application.
 */
export function normalizeDistrict(name: string): string {
  if (!name) return '';

  const cleaned = name.replace(/\s+district/gi, '').trim();
  const lower = cleaned.toLowerCase();

  const mapping: Record<string, string> = {
    kasargod: 'Kasaragod',
    kasaragod: 'Kasaragod',
    trivandrum: 'Thiruvananthapuram',
    thiruvananthapuram: 'Thiruvananthapuram',
    calicut: 'Kozhikode',
    kozhikode: 'Kozhikode',
    cochin: 'Ernakulam',
    ernakulam: 'Ernakulam',
    palghat: 'Palakkad',
    palakkad: 'Palakkad',
    cannanore: 'Kannur',
    kannur: 'Kannur',
    trichur: 'Thrissur',
    thrissur: 'Thrissur',
    alleppey: 'Alappuzha',
    alappuzha: 'Alappuzha',
    quilon: 'Kollam',
    kollam: 'Kollam',
    malappuram: 'Malappuram',
    kottayam: 'Kottayam',
    idukki: 'Idukki',
    pathanamthitta: 'Pathanamthitta',
    wayanad: 'Wayanad',
  };

  return mapping[lower] || cleaned;
}
