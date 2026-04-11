/**
 * Unified search index — single source of truth for all searchable content.
 * Used by: SearchModal, SearchResults, ResourcesList, ExpertsPage
 */

// ─── Articles & Videos ────────────────────────────────────────────────────────
export const SAMPLE_ARTICLES = [
  { id: 'combating-blast',   title: { en: 'Combating Bacterial Leaf Blight',  km: 'ការប្រឆាំងជំងឺបាក់តេរីស្លឹក' },        category: 'plant_diseases',      type: 'article', img: '/images/article1.jpg' },
  { id: 'early-detection',   title: { en: 'Early Detection of Stem Borers',   km: 'ការរកឃើញដំបូងនូវសត្វស្វានដំឡប' },      category: 'plant_diseases',      type: 'article', img: '/images/article2.jpg' },
  { id: 'fertilizer-timing', title: { en: 'Optimal Fertilizer Timing',         km: 'ពេលវេលាល្អបំផុតសម្រាប់ដាក់ជីបំប៉ន' },  category: 'nutrient_deficiency', type: 'video',   img: '/images/article3.jpg' },
  { id: 'soil-ph',           title: { en: 'Understanding Soil pH',             km: 'ការយល់ដឹងអំពី pH ដី' },                  category: 'nutrient_deficiency', type: 'article', img: '/images/article4.jpg' },
  { id: 'irrigation',        title: { en: 'Efficient Irrigation Systems',      km: 'ប្រព័ន្ធស្រោចស្រពប្រកបដោយប្រសិទ្ធភាព' }, category: 'water_management',    type: 'video',   img: '/images/article1.jpg' },
]

// ─── Experts ──────────────────────────────────────────────────────────────────
export const EXPERTS_DATA = [
  {
    id: 1, name: 'Dr. Som Sopheap', nameKm: 'ដុក្តូរ សំ សុភ័ព',
    titleKey: 'expert_role_agricultural_scientist',
    location: { en: 'Phnom Penh, Cambodia', km: 'ភ្នំពេញ, កម្ពុជា' },
    img: '👨‍🔬', telegram: 'dr_sopheap', online: true,
    phone: '+855 12 345 678',
    experience: 14, rating: 4.9, reviews: 38,
    bio: {
      en: 'Dr. Sopheap is a leading agricultural scientist specializing in rice disease management across Southeast Asia. He has advised the Ministry of Agriculture on disease outbreak protocols and authored several peer-reviewed studies on fungal pathogens in Cambodian rice fields.',
      km: 'ដុក្តូរ សុភ័ព គឺជាអ្នកវិទ្យាសាស្ត្រកសិកម្មឈានមុខ ដែលមានជំនាញខាងការគ្រប់គ្រងជំងឺស្រូវក្នុងអាស៊ីអាគ្នេយ៍។ លោកបានផ្តល់យោបល់ដល់ក្រសួងកសិកម្មលើពិធីការជំងឺ ហើយបានសរសេរការសិក្សាវិទ្យាសាស្ត្រជាច្រើនអំពីបណ្តេញជំងឺផ្សិតក្នុងស្រែស្រូវកម្ពុជា។',
    },
    specializations: ['Rice Blast', 'Brown Spot', 'Fungal Pathology', 'Disease Management'],
    education: 'Ph.D. Plant Pathology, Kasetsart University (Thailand)',
    languages: ['Khmer', 'English', 'Thai'],
    availability: 'Mon–Fri, 8:00–17:00',
  },
  {
    id: 2, name: 'Eng Chantrea', nameKm: 'អ៊ែង ច័ន្រ្ទា',
    titleKey: 'expert_role_rice_pathology',
    location: { en: 'Battambang Region', km: 'តំបន់បាត់ដំបង' },
    img: '👨‍🌾', telegram: 'eng_chantrea', online: true,
    phone: '+855 17 234 567',
    experience: 9, rating: 4.7, reviews: 21,
    bio: {
      en: 'Chantrea is a rice pathologist with nearly a decade of fieldwork in the Battambang rice belt. He focuses on early detection of bacterial blight and brown spot, and regularly conducts farmer training workshops on integrated pest management.',
      km: 'ច័ន្រ្ទា គឺជាអ្នកឯកទេសជំងឺស្រូវវ ដែលមានបទពិសោធន៍ជិតមួយទសវត្សនៅក្នុងវាលស្រូវបាត់ដំបង។ គាត់ផ្តោតលើការរកឃើញជំងឺ Bacterial Blight និង Brown Spot ។',
    },
    specializations: ['Bacterial Blight', 'Brown Spot', 'IPM', 'Farmer Training'],
    education: 'M.Sc. Plant Science, Royal University of Agriculture (Cambodia)',
    languages: ['Khmer', 'English'],
    availability: 'Mon–Sat, 7:00–16:00',
  },
  {
    id: 3, name: 'Dr. Ly Rottanak', nameKm: 'ដុក្តូរ លី រដ្ឋណាក់',
    titleKey: 'expert_role_soil_science',
    location: { en: 'Siem Reap Region', km: 'តំបន់សៀមរាប' },
    img: '👩‍🔬', telegram: 'ly_rottanak', online: false,
    phone: '+855 89 456 789',
    experience: 11, rating: 4.8, reviews: 29,
    bio: {
      en: 'Dr. Rottanak specializes in soil science and nutrient management for paddy fields in the Tonle Sap basin. Her research focuses on how soil composition affects susceptibility to root and leaf diseases, and she provides consulting services to large-scale rice farms.',
      km: 'ដុក្តូរ រដ្ឋណាក់ មានជំនាញខាងវិទ្យាសាស្ត្រដី និងការគ្រប់គ្រងជីជាតិសម្រាប់វាលស្រែក្នុងអាងទន្លេសាប។',
    },
    specializations: ['Soil Nutrition', 'Root Disease', 'Paddy Soil Management', 'Water Management'],
    education: 'Ph.D. Soil Science, Wageningen University (Netherlands)',
    languages: ['Khmer', 'English', 'French'],
    availability: 'Tue, Thu, Sat, 9:00–15:00',
  },
  {
    id: 4, name: 'Nhem Sokha', nameKm: 'ញ៉ែម សុខា',
    titleKey: 'expert_role_agricultural_consultant',
    location: { en: 'Kampong Cham', km: 'កំពង់ចាម' },
    img: '👨‍🏫', telegram: 'nhem_sokha', online: true,
    phone: '+855 77 890 123',
    experience: 7, rating: 4.6, reviews: 17,
    bio: {
      en: 'Sokha is an agricultural consultant who works directly with smallholder farmers in Kampong Cham. He focuses on practical, low-cost solutions for crop protection and has helped over 200 farming households improve their yield through better disease management.',
      km: 'សុខា គឺជាអ្នកប្រឹក្សាកសិកម្ម ដែលធ្វើការដោយផ្ទាល់ជាមួយកសិករក្នុងកំពង់ចាម។ គាត់ផ្តោតលើដំណោះស្រាយការពារដំណាំដែលមានតម្លៃទាប។',
    },
    specializations: ['Crop Protection', 'Smallholder Advisory', 'Disease Scouting', 'Cost Management'],
    education: 'B.Sc. Agriculture, National University of Battambang (Cambodia)',
    languages: ['Khmer', 'English'],
    availability: 'Mon–Fri, 7:00–18:00',
  },
  {
    id: 5, name: 'Chan Dara', nameKm: 'ចាន់ ដារ៉ា',
    titleKey: 'expert_role_rice_breeding',
    location: { en: 'Prey Veng', km: 'ព្រៃវែង' },
    img: '👩‍🌾', telegram: 'chan_dara', online: false,
    phone: '+855 96 567 890',
    experience: 12, rating: 4.7, reviews: 24,
    bio: {
      en: 'Dara is a rice breeding specialist at the Cambodian Agricultural Research and Development Institute. She works on developing disease-resistant rice varieties adapted to Cambodian growing conditions, and has contributed to the release of three certified local varieties.',
      km: 'ដារ៉ា គឺជាអ្នកឯកទេសការបន្តពូជស្រូវ នៅវិទ្យាស្ថានស្រាវជ្រាវ និងអភិវឌ្ឍន៍កសិកម្មកម្ពុជា ហើយបានរួមចំណែករំលេចពូជស្រូវ ៣ ប្រភេទ។',
    },
    specializations: ['Rice Breeding', 'Disease Resistance', 'Seed Systems', 'Varietal Selection'],
    education: 'M.Sc. Plant Breeding, IRRI – Los Baños (Philippines)',
    languages: ['Khmer', 'English'],
    availability: 'Mon–Wed, 8:00–17:00',
  },
  {
    id: 6, name: 'Sok Visal', nameKm: 'សុក វិសាល',
    titleKey: 'expert_role_pest_management',
    location: { en: 'Takeo', km: 'តាកែវ' },
    img: '👨‍🔬', telegram: 'sok_visal', online: true,
    phone: '+855 10 678 901',
    experience: 8, rating: 4.5, reviews: 14,
    bio: {
      en: 'Visal is a pest and disease management expert based in Takeo province. He specialises in integrated approaches combining chemical and biological controls, with particular expertise in diagnosing complex multi-pest infestations common to lowland rice.',
      km: 'វិសាល គឺជាអ្នកជំនាញការគ្រប់គ្រងជំងឺ និងសត្វល្អិតនៅខេត្តតាកែវ ដែលមានជំនាញពិសេសក្នុងការធ្វើរោគវិនិច្ឆ័យ។',
    },
    specializations: ['Pest Management', 'Biological Control', 'Multi-pest Diagnosis', 'Lowland Rice'],
    education: 'B.Sc. Agricultural Science, Royal University of Agriculture (Cambodia)',
    languages: ['Khmer', 'English'],
    availability: 'Mon–Sat, 6:30–15:00',
  },
]

// ─── Suppliers ────────────────────────────────────────────────────────────────
export const FEATURED_SUPPLIERS = [
  {
    name: 'Green Growth Agri-Supply',
    icon: '🌱',
    badge: 'Verified',
    desc: { en: 'Sustainable farming solutions with a wide range of certified biological and chemical treatments.', km: 'ដំណោះស្រាយកសិកម្មចីរភាព ជាមួយការព្យាបាលជីវសាស្ត្រ និងគីមីដែលមានការបញ្ជាក់ជាច្រើន។' },
    location: { en: 'Phnom Penh, Cambodia', km: 'ភ្នំពេញ, កម្ពុជា' },
    telegram: 'greengrowth_supply',
  },
  {
    name: 'Harvest HUB',
    icon: '🏪',
    badge: 'Verified',
    desc: { en: 'Premium seeds and modern farming equipment for Cambodian rice farmers.', km: 'គ្រាប់ពូជ និងឧបករណ៍កសិកម្មទំនើបសម្រាប់កសិករស្រូវខ្មែរ។' },
    location: { en: 'Phnom Penh, Cambodia', km: 'ភ្នំពេញ, កម្ពុជា' },
    telegram: 'harvest_hub_kh',
  },
]

export const PRODUCTS = [
  { id: 1, name: 'BlastGuard Pro',      price: '$42.00', img: '🧪', supplier: 'GreenGrowth', telegram: 'greengrowth_supply', tagKey: 'experts_tag_fungicide',    tagColor: '#dc2626', tagBg: '#fef2f2' },
  { id: 2, name: 'Emamid Shield',       price: '$38.50', img: '🧴', supplier: 'AgriTech',    telegram: 'agritech_kh',        tagKey: 'experts_tag_pesticide',    tagColor: '#d97706', tagBg: '#fffbeb' },
  { id: 3, name: 'Tenebricola Resist',  price: '$55.00', img: '💊', supplier: 'CropCare',    telegram: 'cropcare_kh',        tagKey: 'experts_tag_bactericide',  tagColor: '#7c3aed', tagBg: '#f5f3ff' },
  { id: 4, name: 'Lithos Mineral Mix',  price: null,     img: '📦', supplier: 'GreenGrowth', telegram: 'greengrowth_supply', tagKey: 'experts_tag_nutrient',     tagColor: '#059669', tagBg: '#ecfdf5' },
]

// ─── Unified search index ─────────────────────────────────────────────────────
export const SEARCH_INDEX = [
  // Articles & Videos
  ...SAMPLE_ARTICLES.map((a) => ({
    id: `article-${a.id}`,
    type: a.type,
    title: a.title.en,
    titleKm: a.title.km,
    desc: '',
    tags: [a.category.replace(/_/g, ' '), a.type],
    link: `/learn/article/${a.id}`,
    img: a.img,
  })),

  // Experts
  ...EXPERTS_DATA.map((e) => ({
    id: `expert-${e.id}`,
    type: 'expert',
    title: e.name,
    titleKm: e.nameKm,
    desc: e.bio.en.slice(0, 120) + '…',
    tags: e.specializations.map((s) => s.toLowerCase()),
    link: '/experts',
    img: e.img,
  })),

  // Suppliers
  ...FEATURED_SUPPLIERS.map((s) => ({
    id: `supplier-${s.name}`,
    type: 'supplier',
    title: s.name,
    titleKm: s.name,
    desc: s.desc.en,
    tags: ['supplier', 'agri-supply', 'treatments'],
    link: '/experts?tab=suppliers',
    img: s.icon,
  })),

  // Services (static)
  { id: 'svc-detect',    type: 'service', title: 'Disease Detection',     titleKm: 'ការរកឃើញជំងឺ',        desc: 'Upload a photo of your rice crop for instant AI-powered disease identification.', tags: ['detect', 'upload', 'ai', 'analysis', 'disease'],        link: '/detect',                img: '🔬' },
  { id: 'svc-crop',      type: 'service', title: 'Crop Data Integration',  titleKm: 'ការរួមបញ្ចូលទិន្នន័យ',  desc: 'Track your crops health with field data and environmental analysis.',            tags: ['crop', 'field', 'data', 'tracking', 'health'],          link: '/detect',                img: '🌱' },
  { id: 'svc-experts',   type: 'service', title: 'Expert Support',         titleKm: 'ជំនួយពីអ្នកជំនាញ',     desc: 'Connect with certified rice experts and agricultural specialists.',             tags: ['expert', 'support', 'consult', 'advice'],               link: '/experts',               img: '👨‍🔬' },
  { id: 'svc-learn',     type: 'service', title: 'Learning Hub',           titleKm: 'មជ្ឈមណ្ឌលការរៀន',      desc: 'Articles and videos on rice disease prevention and crop management.',           tags: ['learn', 'article', 'video', 'education', 'guide'],      link: '/learn',                 img: '📚' },
  { id: 'svc-suppliers', type: 'service', title: 'Agri Suppliers',         titleKm: 'អ្នកផ្គត់ផ្គង់',        desc: 'Find certified suppliers for fertilizers, seeds, and crop treatments.',        tags: ['supplier', 'buy', 'fertilizer', 'seed', 'treatment'],   link: '/experts?tab=suppliers', img: '🏪' },
]
