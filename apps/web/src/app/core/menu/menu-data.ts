export interface LocalizedText {
  en: string;
  fr: string;
  ar: string;
}

export interface MenuItem {
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
  price: string;
}

export interface MenuCategory {
  key: string;
  items: MenuItem[];
}

const item = (
  slug: string,
  en: string,
  fr: string,
  ar: string,
  price: string,
  description = '',
): MenuItem => ({
  slug,
  name: { en, fr, ar },
  description: { en: description || en, fr: description || fr, ar: description || ar },
  price,
});

export const MENU_CATEGORIES: MenuCategory[] = [
  {
    key: 'coffee.hot',
    items: [
      item('espresso', 'Espresso', 'Espresso', 'إسبريسو', '3 DT'),
      item('cafe-americain', 'Americano', 'Café Américain', 'قهوة أمريكية', '4 DT'),
      item('cafe-creme', 'Coffee Cream', 'Café Crème', 'قهوة كريمة', '4.5 DT'),
      item('cappuccino', 'Cappuccino', 'Cappuccino', 'كابتشينو', '5.5 DT'),
      item('cafe-aromatise', 'Flavoured Coffee', 'Café Aromatisé', 'قهوة منكهة', '6.5 DT'),
    ],
  },
  {
    key: 'coffee.cold',
    items: [
      item('iced-coffee-vanilla', 'Vanilla Iced Coffee', 'Iced Coffee Vanille', 'قهوة مثلجة بالفانيلا', '8 DT'),
      item('iced-coffee-caramel', 'Caramel Iced Coffee', 'Iced Coffee Caramel', 'قهوة مثلجة بالكراميل', '8 DT'),
      item('iced-coffee-hazelnut', 'Hazelnut Iced Coffee', 'Iced Coffee Noisette', 'قهوة مثلجة بالبندق', '8 DT'),
      item('iced-coffee-nutella', 'Nutella Iced Coffee', 'Iced Coffee Nutella', 'قهوة مثلجة بالنوتيلا', '10 DT'),
    ],
  },
  {
    key: 'coffee.frappuccino',
    items: [
      item('frappuccino-vanilla', 'Vanilla Frappuccino', 'Frappuccino Vanille', 'فرابوتشينو فانيلا', '9 DT'),
      item('frappuccino-caramel', 'Caramel Frappuccino', 'Frappuccino Caramel', 'فرابوتشينو كراميل', '9 DT'),
      item('frappuccino-hazelnut', 'Hazelnut Frappuccino', 'Frappuccino Noisette', 'فرابوتشينو بندق', '9 DT'),
      item('frappuccino-nutella', 'Nutella Frappuccino', 'Frappuccino Nutella', 'فرابوتشينو نوتيلا', '10 DT'),
      item('frappuccino-oreo', 'Oreo Frappuccino', 'Frappuccino Oreo', 'فرابوتشينو أوريو', '11 DT'),
      item('frappuccino-pistachio', 'Pistachio Frappuccino', 'Frappuccino Pistache', 'فرابوتشينو فستق', '12 DT'),
    ],
  },
  {
    key: 'drinks.fresh-juices',
    items: [
      item('lemon-juice', 'Fresh Lemon Juice', 'Jus de Citron', 'عصير ليمون طازج', '5 DT'),
      item('orange-juice', 'Fresh Orange Juice', "Jus d'Orange", 'عصير برتقال طازج', '6 DT'),
      item('banana-juice', 'Banana Juice', 'Jus de Banane', 'عصير موز', '7 DT'),
      item('strawberry-juice', 'Strawberry Juice', 'Jus de Fraise', 'عصير فراولة', '7 DT'),
      item('fresh-fruit-cocktail', 'Fresh Fruit Cocktail', 'Cocktail Fruits Frais', 'كوكتيل فواكه طازجة', '9 DT'),
    ],
  },
  {
    key: 'breakfast',
    items: [
      item('breakfast-fast', 'Fast Breakfast', 'Petit déjeuner Fast', 'فطور سريع', '14 DT'),
      item('breakfast-kids', 'Kids Breakfast', 'Petit déjeuner Kids', 'فطور الأطفال', '13 DT'),
      item('breakfast-classic', 'Breakfast Classic', 'Breakfast Classic', 'فطور كلاسيكي', '25 DT'),
      item('breakfast-healthy', 'Healthy Breakfast', 'Healthy Breakfast', 'فطور صحي', '32 DT'),
      item('breakfast-aroma-signature', 'Aroma Signature Breakfast', 'Spécial Aroma Signature', 'فطور أروما الخاص', '48 DT'),
    ],
  },
  {
    key: 'sweet-crepes',
    items: [
      item('crepe-nature', 'Plain Crepe', 'Crêpe Nature', 'كريب طبيعي', '9 / 11 DT'),
      item('crepe-banana', 'Banana Crepe', 'Crêpe Banane', 'كريب بالموز', '10.5 / 12.5 DT'),
      item('crepe-aroma-special', 'Aroma Special Crepe', 'Crêpe Aroma Spécial', 'كريب أروما الخاص', '15 / 17 DT'),
    ],
  },
  {
    key: 'waffles-pancakes',
    items: [
      item('waffle-nature', 'Plain Waffle', 'Gaufre Nature', 'وافل طبيعي', '10 / 12 DT'),
      item('waffle-banana', 'Banana Waffle', 'Gaufre Banane', 'وافل بالموز', '11.5 / 13.5 DT'),
      item('pancakes-nature', 'Plain Pancakes', 'Pancakes Nature', 'بان كيك طبيعي', '10 / 12 DT'),
      item('pancakes-aroma-special', 'Aroma Special Pancakes', 'Pancakes Aroma Spécial', 'بان كيك أروما الخاص', '16 / 18 DT'),
    ],
  },
  {
    key: 'savory-desserts',
    items: [
      item('savory-crepe-tuna-cheese', 'Tuna & Cheese Crepe', 'Crêpe Thon & Fromage', 'كريب تونة وجبن', '12 DT'),
      item('savory-crepe-tunisian', 'Tunisian Crepe', 'Crêpe Tunisienne', 'كريب تونسية', '14 DT'),
      item('ice-cream-aroma', 'Aroma Special Ice Cream', 'Coupe Spéciale Aroma', 'مثلجات أروما الخاصة', '14 DT'),
      item('chocolate-fondant', 'Chocolate Fondant', 'Fondant Chocolat', 'فوندان شوكولاتة', '8 DT'),
      item('pistachio-cheesecake', 'Pistachio Cheesecake', 'Cheesecake Pistache', 'تشيزكيك فستق', '11 DT'),
    ],
  },
  {
    key: 'evening-packs',
    items: [
      item('pack-classique', 'Classic Pack', 'Pack Classique', 'الباقة الكلاسيكية', '17 DT'),
      item('pack-gourmand', 'Gourmet Pack', 'Pack Gourmand', 'الباقة الشهية', '21 DT'),
      item('pack-duo', 'Duo Pack', 'Pack Duo', 'باقة لشخصين', '30 DT'),
      item('pack-friends', 'Friends Pack', 'Pack Friends', 'باقة الأصدقاء', '55 DT'),
    ],
  },
];

export const MENU_ITEMS = MENU_CATEGORIES.flatMap((category) => category.items);
