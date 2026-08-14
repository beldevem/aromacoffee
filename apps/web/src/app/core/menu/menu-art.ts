const palette = ['#50684E', '#354A36', '#71866C', '#C9AA70', '#E8D7AB'];

const encode = (svg: string): string =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

const toneFor = (value: string): string => palette[value.length % palette.length];

const hashOf = (value: string): number => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash);
};

export function categoryImage(categoryKey: string): string {
  const tone = toneFor(categoryKey);
  const accent = palette[(categoryKey.length + 2) % palette.length];

  return encode(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
    <rect width="900" height="600" fill="#F7F5EF"/>
    <circle cx="720" cy="90" r="190" fill="${tone}" opacity=".18"/>
    <circle cx="90" cy="520" r="220" fill="${accent}" opacity=".18"/>
    <path d="M0 470 C190 370 270 560 450 455 S710 360 900 470 V600 H0Z" fill="${tone}" opacity=".9"/>
    <circle cx="450" cy="280" r="118" fill="#E8D7AB"/>
    <circle cx="450" cy="280" r="92" fill="${tone}"/>
    <path d="M450 205 C405 245 405 315 450 355 C495 315 495 245 450 205Z" fill="#E8D7AB"/>
    <path d="M450 218 C442 260 442 300 450 342" fill="none" stroke="${tone}" stroke-width="10" stroke-linecap="round"/>
    <circle cx="450" cy="280" r="128" fill="none" stroke="${accent}" stroke-width="4" stroke-dasharray="8 14"/>
  </svg>`);
}

export function productImage(slug: string, categoryKey: string): string {
  const slugHash = hashOf(slug);
  const tone = toneFor(slug);
  const accent = palette[(slugHash + categoryKey.length) % palette.length];
  const rotation = (slug.length * 7) % 24 - 12;
  const sway = (slugHash % 11) - 5;
  const lift = slugHash % 7;
  const dotX = 760 + (slugHash % 70);
  const dotY = 420 + (slugHash % 110);
  const isHotCoffee = categoryKey === 'coffee.hot';
  const isColdCoffee = categoryKey === 'coffee.cold';
  const isFrappuccino = categoryKey === 'coffee.frappuccino';
  const isJuice = categoryKey.includes('juice');
  const isBreakfast = categoryKey === 'breakfast';
  const isCrepe = categoryKey.includes('crepe');
  const isWaffle = categoryKey.includes('waffle');
  const isDessert = categoryKey.includes('dessert');
  const isPack = categoryKey === 'evening-packs';
  const hasStrongCrema = slug.includes('espresso') || slug.includes('creme');
  const hasWideCup = slug.includes('americain') || slug.includes('americano');
  const hasFlavorDrizzle = slug.includes('aromatise') || slug.includes('cappuccino');

  let subject = `<ellipse cx="0" cy="42" rx="185" ry="34" fill="#1E211C" opacity=".16"/>
    <ellipse cx="0" cy="0" rx="154" ry="112" fill="${tone}"/>
    <ellipse cx="0" cy="-14" rx="126" ry="82" fill="#E8D7AB"/>
    <path d="M0 -92 C-52 -40 -52 18 0 68 C52 18 52 -40 0 -92Z" fill="${accent}"/>
    <path d="M0 -76 C-12 -25 -12 20 0 54" fill="none" stroke="#F7F5EF" stroke-width="10" stroke-linecap="round"/>`;

  if (isHotCoffee) {
    const isEspresso = slug.includes('espresso');
    const isAmericano = slug.includes('americain') || slug.includes('americano');
    const isCreme = slug.includes('creme');
    const isCappuccino = slug.includes('cappuccino');
    const cupHalfWidth = hasWideCup ? 162 : 145;
    const foamAmplitude = hasStrongCrema ? 58 : 42;
    const steamTop = hasWideCup ? -198 : -178;
    const crema = hasStrongCrema ? '#C28C4F' : tone;

    if (isEspresso) {
      subject = `<ellipse cx="0" cy="100" rx="168" ry="26" fill="#1E211C" opacity=".16"/>
        <path d="M-112 -8 H112 V58 C112 95 80 122 0 122 C-80 122 -112 95 -112 58Z" fill="#E8D7AB"/>
        <ellipse cx="0" cy="-8" rx="112" ry="34" fill="#85572F"/>
        <path d="M-50 -16 Q-20 -44 0 -16 T50 -16" fill="none" stroke="#F7F5EF" stroke-width="10"/>
        <ellipse cx="-32" cy="16" rx="15" ry="9" fill="#3C2417" transform="rotate(-18)"/>
        <ellipse cx="16" cy="20" rx="15" ry="9" fill="#3C2417" transform="rotate(16)"/>`;
    } else if (isAmericano) {
      subject = `<ellipse cx="0" cy="108" rx="198" ry="28" fill="#1E211C" opacity=".16"/>
        <path d="M-168 -18 H145 V78 C145 128 104 160 0 160 C-104 160 -168 128 -168 78Z" fill="#E8D7AB"/>
        <ellipse cx="-8" cy="-18" rx="145" ry="43" fill="#9A6847"/>
        <path d="M142 20 C188 18 188 112 142 114" fill="none" stroke="#E8D7AB" stroke-width="16" stroke-linecap="round"/>
        <path d="M-96 -55 C-112 -116 -78 -128 -88 -196 M-18 -58 C-28 -126 8 -130 -2 -202 M58 -54 C48 -116 86 -128 76 -194" fill="none" stroke="${accent}" stroke-width="8" stroke-linecap="round"/>`;
    } else {
      subject = `<ellipse cx="0" cy="100" rx="190" ry="28" fill="#1E211C" opacity=".16"/>
        <path d="M-${cupHalfWidth} -10 H${cupHalfWidth} V75 C${cupHalfWidth} 125 105 155 0 155 C-105 155 -${cupHalfWidth} 125 -${cupHalfWidth} 75Z" fill="#E8D7AB"/>
        <ellipse cx="0" cy="-10" rx="${cupHalfWidth}" ry="45" fill="${crema}"/>
        <path d="M-${foamAmplitude} -18 Q-${Math.round(foamAmplitude / 2)} -${62 + lift} 0 -18 T${foamAmplitude} -18" fill="none" stroke="#F7F5EF" stroke-width="12"/>
        <path d="M-${104 + sway} -45 C-${120 + sway} -110 -${80 + sway} -120 -${90 + sway} -${steamTop + 5} M-${24 + sway} -50 C-${35 + sway} -120 ${5 + sway} -125 -${5 - sway} ${steamTop - 10} M${55 + sway} -45 C${45 + sway} -105 ${85 + sway} -125 ${75 + sway} ${steamTop}" fill="none" stroke="${accent}" stroke-width="8" stroke-linecap="round"/>`;
    }

    if (isCreme) {
      subject += `<path d="M-64 -7 Q-24 -42 0 -7 T64 -7" fill="none" stroke="#F7F5EF" stroke-width="9"/>`;
    }

    if (isCappuccino) {
      subject += `<circle cx="-60" cy="-28" r="11" fill="#F7F5EF"/><circle cx="-32" cy="-35" r="12" fill="#F7F5EF"/><circle cx="-5" cy="-30" r="10" fill="#F7F5EF"/>`;
    }

    if (hasFlavorDrizzle) {
      subject += `<path d="M-${72 + sway} 6 Q0 ${24 + lift} ${70 - sway} 8" fill="none" stroke="${accent}" stroke-width="10" stroke-linecap="round" opacity=".85"/>`;
    }
  } else if (isColdCoffee || isFrappuccino) {
    const flavor = slug.includes('vanilla') ? '#E8D7AB'
      : slug.includes('caramel') ? '#B9783D'
      : slug.includes('hazelnut') ? '#7B4F36'
      : slug.includes('nutella') ? '#58382C'
      : slug.includes('oreo') ? '#252525'
      : slug.includes('pistachio') ? '#71866C'
      : '#9A6847';

    subject = isFrappuccino
      ? `<ellipse cx="0" cy="145" rx="135" ry="22" fill="#1E211C" opacity=".16"/>
        <path d="M-92 -45 H92 L70 145 Q0 175 -70 145Z" fill="#F7F5EF" stroke="${tone}" stroke-width="10"/>
        <path d="M-78 -15 H78 L62 132 Q0 150 -62 132Z" fill="${flavor}"/>
        <path d="M-88 -55 Q-65 -105 -35 -62 Q0 -120 30 -62 Q65 -105 88 -55 Q65 -20 0 -30 Q-65 -20 -88 -55Z" fill="#F7F5EF" stroke="${accent}" stroke-width="7"/>
        <circle cx="-45" cy="-80" r="12" fill="${accent}"/><circle cx="42" cy="-84" r="12" fill="${accent}"/>`
      : `<ellipse cx="0" cy="135" rx="155" ry="24" fill="#1E211C" opacity=".16"/>
        <path d="M-105 -75 H105 L80 125 Q0 155 -80 125Z" fill="#F7F5EF" stroke="${tone}" stroke-width="10"/>
        <path d="M-88 -15 H88 L70 115 Q0 138 -70 115Z" fill="${flavor}"/>
        <path d="M-104 -76 H104" stroke="#E8D7AB" stroke-width="12"/>
        <circle cx="-25" cy="-105" r="20" fill="${accent}"/>`;
  } else if (isJuice) {
    subject = `<ellipse cx="0" cy="155" rx="150" ry="24" fill="#1E211C" opacity=".15"/>
      <path d="M-92 -80 H92 L70 145 Q0 175 -70 145Z" fill="#F7F5EF" stroke="${tone}" stroke-width="12"/>
      <path d="M-72 -15 H72 L60 135 Q0 155 -60 135Z" fill="${accent}"/>
      <path d="M20 -90 L120 -190" stroke="${tone}" stroke-width="10" stroke-linecap="round"/>
      <circle cx="-110" cy="-70" r="34" fill="${accent}"/><path d="M-110 -104 A34 34 0 0 0 -110 -36" fill="none" stroke="#F7F5EF" stroke-width="8"/>`;
  } else if (isBreakfast || isPack) {
    subject = `<ellipse cx="0" cy="125" rx="205" ry="35" fill="#1E211C" opacity=".16"/>
      <ellipse cx="0" cy="78" rx="190" ry="70" fill="#E8D7AB"/>
      <circle cx="-85" cy="55" r="48" fill="${tone}"/><circle cx="75" cy="55" r="52" fill="${accent}"/>
      <path d="M-145 -45 L-70 -105 L5 -35 L-70 20Z" fill="#F7F5EF" stroke="${tone}" stroke-width="8"/>
      <path d="M35 -65 Q100 -135 165 -65 L140 15 H60Z" fill="#F7F5EF" stroke="${tone}" stroke-width="8"/>
      <circle cx="-35" cy="75" r="14" fill="#354A36"/><circle cx="115" cy="75" r="14" fill="#354A36"/>`;
  } else if (isCrepe) {
    subject = `<ellipse cx="0" cy="120" rx="185" ry="28" fill="#1E211C" opacity=".16"/>
      <ellipse cx="0" cy="55" rx="170" ry="75" fill="#E8D7AB"/>
      <path d="M-130 25 Q0 -80 130 25 L0 110Z" fill="${tone}"/>
      <path d="M-80 10 Q0 -45 80 10" fill="none" stroke="${accent}" stroke-width="18" stroke-linecap="round"/>
      <circle cx="-105" cy="-15" r="18" fill="#A43C35"/><circle cx="110" cy="-5" r="18" fill="#376B4A"/>`;
  } else if (isWaffle) {
    subject = `<ellipse cx="0" cy="125" rx="190" ry="28" fill="#1E211C" opacity=".16"/>
      <rect x="-145" y="-70" width="290" height="190" rx="22" fill="${tone}" transform="rotate(-8)"/>
      <path d="M-95 -55 V100 M-25 -65 V105 M45 -65 V105 M115 -55 V95 M-135 -5 H135 M-125 55 H125" stroke="#E8D7AB" stroke-width="18" opacity=".8" transform="rotate(-8)"/>
      <path d="M-70 -85 Q0 -125 70 -85" fill="none" stroke="${accent}" stroke-width="16" stroke-linecap="round"/>`;
  } else if (isDessert) {
    subject = `<ellipse cx="0" cy="130" rx="180" ry="28" fill="#1E211C" opacity=".16"/>
      <path d="M-105 50 Q0 -30 105 50 L80 105 Q0 140 -80 105Z" fill="${tone}"/>
      <path d="M-90 45 Q0 -20 90 45" fill="none" stroke="#E8D7AB" stroke-width="22" stroke-linecap="round"/>
      <path d="M-55 25 Q0 -45 55 25" fill="none" stroke="${accent}" stroke-width="16" stroke-linecap="round"/>
      <circle cx="-80" cy="30" r="16" fill="#A43C35"/><circle cx="80" cy="30" r="16" fill="#A43C35"/>`;
  }

  return encode(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
    <title>${slug}</title>
    <rect width="900" height="600" fill="#FFFEFA"/>
    <circle cx="740" cy="110" r="170" fill="${accent}" opacity=".2"/>
    <circle cx="130" cy="520" r="230" fill="${tone}" opacity=".16"/>
    <g transform="translate(450 ${302 - lift}) rotate(${rotation + sway})">${subject}</g>
    <circle cx="85" cy="90" r="8" fill="${tone}"/>
    <circle cx="115" cy="70" r="5" fill="${accent}"/>
    <circle cx="${dotX}" cy="${dotY}" r="7" fill="${tone}"/>
  </svg>`);
}
