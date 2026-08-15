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
  isPromotion: boolean;
  originalPrice?: string;
  promotionPrice?: string;
  status: 'PUBLISHED' | 'DRAFT' | 'HIDDEN';
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
  promotion?: { originalPrice: string; promotionPrice: string },
): MenuItem => ({
  slug,
  name: { en, fr, ar },
  description: { en: description || en, fr: description || fr, ar: description || ar },
  price,
  isPromotion: Boolean(promotion),
  originalPrice: promotion?.originalPrice,
  promotionPrice: promotion?.promotionPrice,
  status: 'PUBLISHED',
});

export const MENU_CATEGORIES: MenuCategory[] = [
  {
    key: 'coffee.hot',
    items: [
      item('espresso', 'Espresso', 'Espresso', 'إسبريسو', '3 DT'),
      item('cafe-americain', 'Americano', 'Café Américain', 'قهوة أمريكية', '4 DT'),
      item('cafe-creme', 'Coffee Cream', 'Café Crème', 'قهوة كريمة', '4.5 DT'),
      item('cappuccino', 'Cappuccino', 'Cappuccino', 'كابتشينو', '9 DT', '', { originalPrice: '12 DT', promotionPrice: '9 DT' }),
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
      item('frappuccino-ferrero-rocher', 'Ferrero Rocher Frappuccino', 'Frappuccino Ferrero Rocher', 'فرابوتشينو فيريرو روشيه', '12 DT'),
      item('frappuccino-pistachio', 'Pistachio Frappuccino', 'Frappuccino Pistache', 'فرابوتشينو فستق', '12 DT'),
    ],
  },
  {
    key: 'chocolates',
    items: [
      item('hot-chocolate-plain', 'Plain Hot Chocolate', 'Chocolat Chaud Nature', 'شوكولاتة ساخنة طبيعية', '5 DT'),
      item('hot-chocolate-whipped-cream', 'Hot Chocolate with Chantilly', 'Chocolat Chaud Chantilly', 'شوكولاتة ساخنة بالكريمة', '6 DT'),
      item('hot-chocolate-dried-fruit', 'Hot Chocolate with Dried Fruit', 'Chocolat Chaud Fruits Secs', 'شوكولاتة ساخنة بالفواكه الجافة', '7 DT'),
      item('hot-chocolate-aroma', 'Aroma Special Hot Chocolate', 'Chocolat Chaud Spécial Aroma', 'شوكولاتة أروما الساخنة الخاصة', '9 DT'),
      item('iced-chocolate-plain', 'Plain Iced Chocolate', 'Chocolat Glacé Nature', 'شوكولاتة مثلجة طبيعية', '7 DT'),
      item('iced-chocolate-whipped-cream', 'Iced Chocolate with Chantilly', 'Chocolat Glacé Chantilly', 'شوكولاتة مثلجة بالكريمة', '8 DT'),
      item('iced-chocolate-dried-fruit', 'Iced Chocolate with Dried Fruit', 'Chocolat Glacé Fruits Secs', 'شوكولاتة مثلجة بالفواكه الجافة', '9 DT'),
      item('iced-chocolate-aroma', 'Aroma Special Iced Chocolate', 'Chocolat Glacé Spécial Aroma', 'شوكولاتة أروما المثلجة الخاصة', '11 DT'),
    ],
  },
  {
    key: 'drinks.fresh-juices',
    items: [
      item('lemon-juice', 'Fresh Lemon Juice', 'Jus de Citron', 'عصير ليمون طازج', '5 DT'),
      item('orange-juice', 'Fresh Orange Juice', "Jus d'Orange", 'عصير برتقال طازج', '6 DT'),
      item('banana-juice', 'Banana Juice', 'Jus de Banane', 'عصير موز', '7 DT'),
      item('strawberry-juice', 'Strawberry Juice', 'Jus de Fraise', 'عصير فراولة', '7 DT'),
      item('kiwi-juice', 'Kiwi Juice', 'Jus de Kiwi', 'عصير كيوي', '8 DT'),
      item('fresh-fruit-cocktail', 'Fresh Fruit Cocktail', 'Cocktail Fruits Frais', 'كوكتيل فواكه طازجة', '9 DT'),
    ],
  },
  {
    key: 'milkshakes',
    items: [
      item('milkshake-vanilla-strawberry-banana', 'Vanilla / Strawberry / Banana Milkshake', 'Milkshake Vanille / Fraise / Banane', 'ميلك شيك فانيلا وفراولة وموز', '8 DT'),
      item('milkshake-nutella-mars-snickers', 'Nutella / Mars / Snickers Milkshake', 'Milkshake Nutella / Mars / Snickers', 'ميلك شيك نوتيلا ومارس وسنيكرز', '10 DT'),
      item('milkshake-x-plose', 'X-Plose Milkshake', 'Milkshake X-Plose', 'ميلك شيك إكس بلوز', '12 DT'),
    ],
  },
  {
    key: 'smoothies',
    items: [
      item('smoothie-watermelon', 'Watermelon Smoothie', 'Smoothie Pastèque', 'سموثي بطيخ', '8 DT'),
      item('smoothie-melon', 'Melon Smoothie', 'Smoothie Melon', 'سموثي شمام', '8 DT'),
      item('smoothie-strawberry', 'Strawberry Smoothie', 'Smoothie Fraise', 'سموثي فراولة', '9 DT'),
      item('smoothie-kiwi', 'Kiwi Smoothie', 'Smoothie Kiwi', 'سموثي كيوي', '9 DT'),
      item('smoothie-pina-colada', 'Piña Colada Smoothie', 'Smoothie Piña Colada', 'سموثي بينا كولادا', '10 DT'),
      item('smoothie-red-fruits', 'Red Fruits Smoothie', 'Smoothie Fruits Rouges', 'سموثي فواكه حمراء', '11 DT'),
    ],
  },
  {
    key: 'mojitos',
    items: [
      item('mojito-virgin', 'Virgin Mojito', 'Mojito Virgin', 'موهيتو فيرجن', '9 DT'),
      item('mojito-strawberry', 'Strawberry Mojito', 'Mojito Fraise', 'موهيتو فراولة', '10 DT'),
      item('mojito-watermelon', 'Watermelon Mojito', 'Mojito Pastèque', 'موهيتو بطيخ', '10 DT'),
      item('mojito-melon', 'Melon Mojito', 'Mojito Melon', 'موهيتو شمام', '10 DT'),
      item('mojito-blue', 'Blue Mojito', 'Mojito Blue', 'موهيتو أزرق', '11 DT'),
      item('mojito-pina-colada', 'Piña Colada Mojito', 'Mojito Piña Colada', 'موهيتو بينا كولادا', '12 DT'),
      item('mojito-energy', 'Energy Mojito', 'Mojito Énergétique', 'موهيتو طاقة', '13 DT'),
    ],
  },
  {
    key: 'signature-cocktails',
    items: [
      item('cocktail-sportif', 'Sportif Cocktail', 'Cocktail Sportif', 'كوكتيل رياضي', '9 DT'),
      item('cocktail-punch', 'Punch Cocktail', 'Cocktail Punch', 'كوكتيل بانش', '9 DT'),
      item('cocktail-kiwi-blue', 'Kiwi Blue', 'Kiwi Blue', 'كيوي بلو', '10 DT'),
      item('cocktail-melon-blue', 'Melon Blue', 'Melon Blue', 'شمام بلو', '10 DT'),
      item('cocktail-watermelon-blue', 'Watermelon Blue', 'Pastèque Blue', 'بطيخ بلو', '10 DT'),
      item('cocktail-aroma-signature', 'Aroma Signature Cocktail', 'Cocktail Spécial Aroma Signature', 'كوكتيل أروما الخاص', '12 DT'),
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
    key: 'omelettes',
    items: [
      item('omelette-tuna-cheese', 'Tuna & Cheese Omelette', 'Omelette Thon & Fromage', 'أومليت تونة وجبن', '10 DT'),
      item('omelette-ham-cheese', 'Ham & Cheese Omelette', 'Omelette Jambon & Fromage', 'أومليت لحم وجبن', '10 DT'),
      item('omelette-aroma', 'Aroma Special Omelette', 'Omelette Spéciale Aroma', 'أومليت أروما الخاصة', '13 DT'),
    ],
  },
  {
    key: 'sweet-crepes',
    items: [
      item('crepe-nature', 'Plain Crepe', 'Crêpe Nature', 'كريب طبيعي', '9 / 11 DT'),
      item('crepe-banana', 'Banana Crepe', 'Crêpe Banane', 'كريب بالموز', '10.5 / 12.5 DT'),
      item('crepe-dried-fruit', 'Dried Fruit Crepe', 'Crêpe Fruits Secs', 'كريب بالفواكه الجافة', '11.5 / 13.5 DT'),
      item('crepe-seasonal-fruit', 'Seasonal Fruit Crepe', 'Crêpe Fruits de Saison', 'كريب بفواكه موسمية', '11.5 / 13.5 DT'),
      item('crepe-aroma-special', 'Aroma Special Crepe', 'Crêpe Aroma Spécial', 'كريب أروما الخاص', '15 / 17 DT'),
    ],
  },
  {
    key: 'waffles-pancakes',
    items: [
      item('waffle-nature', 'Plain Waffle', 'Gaufre Nature', 'وافل طبيعي', '10 / 12 DT'),
      item('waffle-banana', 'Banana Waffle', 'Gaufre Banane', 'وافل بالموز', '11.5 / 13.5 DT'),
      item('waffle-dried-fruit', 'Dried Fruit Waffle', 'Gaufre Fruits Secs', 'وافل بالفواكه الجافة', '12.5 / 14.5 DT'),
      item('waffle-seasonal-fruit', 'Seasonal Fruit Waffle', 'Gaufre Fruits de Saison', 'وافل بفواكه موسمية', '12.5 / 14.5 DT'),
      item('waffle-aroma-special', 'Aroma Special Waffle', 'Gaufre Aroma Spécial', 'وافل أروما الخاص', '16 / 18 DT'),
      item('pancakes-nature', 'Plain Pancakes', 'Pancakes Nature', 'بان كيك طبيعي', '10 / 12 DT'),
      item('pancakes-banana', 'Banana Pancakes', 'Pancakes Banane', 'بان كيك بالموز', '11.5 / 13.5 DT'),
      item('pancakes-dried-fruit', 'Dried Fruit Pancakes', 'Pancakes Fruits Secs', 'بان كيك بالفواكه الجافة', '12.5 / 14.5 DT'),
      item('pancakes-seasonal-fruit', 'Seasonal Fruit Pancakes', 'Pancakes Fruits de Saison', 'بان كيك بفواكه موسمية', '12.5 / 14.5 DT'),
      item('pancakes-aroma-special', 'Aroma Special Pancakes', 'Pancakes Aroma Spécial', 'بان كيك أروما الخاص', '16 / 18 DT'),
    ],
  },
  {
    key: 'savory-desserts',
    items: [
      item('savory-crepe-tuna-cheese', 'Tuna & Cheese Crepe', 'Crêpe Thon & Fromage', 'كريب تونة وجبن', '12 DT'),
      item('savory-crepe-tunisian', 'Tunisian Crepe', 'Crêpe Tunisienne', 'كريب تونسية', '14 DT'),
      item('savory-crepe-ham-cheese', 'Ham & Cheese Crepe', 'Crêpe Jambon & Fromage', 'كريب لحم وجبن', '12 DT'),
      item('savory-crepe-aroma-chef', 'Aroma Chef Special Crepe', 'Spéciale Aroma Chef', 'كريب أروما الشيف الخاصة', '17 DT'),
      item('ice-cream-aroma', 'Aroma Special Ice Cream', 'Coupe Spéciale Aroma', 'مثلجات أروما الخاصة', '14 DT'),
      item('ice-cream-two-scoops', 'Two Scoops of Ice Cream', '2 Boules au choix', 'كرتان مثلجات حسب الاختيار', '7 DT'),
      item('ice-cream-three-scoops', 'Three Scoops of Ice Cream', '3 Boules au choix', 'ثلاث كرات مثلجات حسب الاختيار', '10 DT'),
      item('chocolate-fondant', 'Chocolate Fondant', 'Fondant Chocolat', 'فوندان شوكولاتة', '8 DT'),
      item('pistachio-fondant', 'Pistachio Fondant', 'Fondant Pistache', 'فوندان فستق', '10 DT'),
      item('chocolate-cheesecake', 'Chocolate Cheesecake', 'Cheesecake Chocolat', 'تشيزكيك شوكولاتة', '9 DT'),
      item('nutella-cheesecake', 'Nutella Cheesecake', 'Cheesecake Nutella', 'تشيزكيك نوتيلا', '10 DT'),
      item('oreo-cheesecake', 'Oreo Cheesecake', 'Cheesecake Oreo', 'تشيزكيك أوريو', '10 DT'),
      item('speculoos-cheesecake', 'Speculoos Cheesecake', 'Cheesecake Spéculoos', 'تشيزكيك سبكيولوس', '10 DT'),
      item('pistachio-cheesecake', 'Pistachio Cheesecake', 'Cheesecake Pistache', 'تشيزكيك فستق', '11 DT'),
    ],
  },
  {
    key: 'jwajem-drinks',
    items: [
      item('jwajem-normal', 'Normal Jwajem', 'Jwajem Normal', 'جواجم عادي', '10 DT'),
      item('jwajem-aroma', 'Aroma Jwajem', 'Jwajem Aroma', 'جواجم أروما', '15 DT'),
      item('water-half-liter', 'Water 0.5L', 'Eau 0.5L', 'ماء 0.5 لتر', '1.5 DT'),
      item('water-one-liter', 'Water 1L', 'Eau 1L', 'ماء 1 لتر', '2 DT'),
      item('soda', 'Soda', 'Soda', 'مشروب غازي', '3 DT'),
      item('energy-drink', 'Energy Drink', 'Énergétique', 'مشروب طاقة', '6 DT'),
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
