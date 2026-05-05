"""add products table and seed vigor supplier + products

Revision ID: 3f8a1c9b2d45
Revises: 164ea74f2169
Create Date: 2026-05-05 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime, timezone

revision = '3f8a1c9b2d45'
down_revision = '164ea74f2169'
branch_labels = None
depends_on = None

VIGOR_PROFILE_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

_NOW = datetime(2026, 5, 5, 0, 0, 0, tzinfo=timezone.utc)

_PRODUCTS = [
    {
        'id': 'b0000001-0000-0000-0000-000000000001',
        'name_en': 'Vigor BioYield+',
        'name_km': 'វីហ្គីប យអូមហ ផល',
        'category': 'Yield Booster',
        'desc_en': (
            'Vigor BioYield+ is a smart choice for farmers who want to maximize their crop yields at low cost. '
            'This special formula stimulates more flowering and fruiting with high quality by improving the '
            'efficiency of nutrient absorption and utilization, reducing spending on chemical fertilizers.'
        ),
        'desc_km': (
            'វីហ្គីប យអូមហ ផល គឺជាជម្រើសដ៏ឆ្លាតវៃ សម្រាប់កសិករដែលចង់បង្កើនទិន្នផលដំណាំ '
            'ដោយការចំណាយទុនតិច។ រូបមន្តពិសេសនេះត្រូវបានរចនាឡើង ដើម្បីជំរុញការចេញផ្កា '
            'និងផ្លែច្រើន ប្រកដោយគុណភាពខ្ពស់ តាមរយៈការបង្កើនប្រសិទ្ធភាពនៃការស្រូបយក '
            'និងប្រើប្រាស់សារធាតុចិញ្ចឹម។'
        ),
        'usage_instructions_en': (
            'Fruit trees (Durian, Mangosteen): Mix 1L with 250–500L water, spray to wet crops and soil.\n'
            'Medium crops (Rice, Cassava): Mix 100ml with 20–25L water, spray 3–4 times per season.\n'
            'Seedlings/leafy vegetables: Mix 50–70ml with 20–25L water, spray every 5–7 days.\n'
            'Best applied in early morning, cool afternoon, or after rainfall.'
        ),
        'usage_instructions_km': (
            'ដំណាំឈើហូបផ្លែ: ប្រើ ១ លីត្រ លាយជាមួយទឹក ២៥០-៥០០ លីត្រ បាញ់ឲ្យសើមសព្វ។\n'
            'ដំណាំមធ្យម (ស្រូវវ ដំឡូងមី): ប្រើ ១០០ មល លាយទឹក ២០-២៥ លីត្រ បាញ់ ៣-៤ ដង/រដូវ។\n'
            'ដំណាំវិលជុំ/បន្លែ: ប្រើ ៥០-៧០ មល លាយទឹក ២០-២៥ លីត្រ បាញ់រាល់ ៥-៧ ថ្ងៃ ម្តង។'
        ),
        'nutrients_json': {
            'N': '0.63%', 'P2O5': '0.48%', 'K2O': '3.6%',
            'MgO': '3500 ppm', 'CaO': '3200 ppm', 'B': '80 ppm',
            'Fe': '30 ppm', 'Al': '<10 ppm', 'Cu': '<10 ppm',
            'Zn': '20 ppm', 'Mn': '<10 ppm',
            'AminoAcids': '18 types', 'Microorganisms': '~6.7x10^5 cfu/ml',
        },
    },
    {
        'id': 'b0000001-0000-0000-0000-000000000002',
        'name_en': 'Vigor BioLatex',
        'name_km': 'ជីធម្មជាតិកៅស៊ូ',
        'category': 'Rubber Tree Fertilizer',
        'desc_en': (
            'Vigor BioLatex is a new-technology natural fertilizer specially designed for rubber trees. '
            'It provides macro-nutrients (NPK, Magnesium), natural micro-nutrients, and up to 18 types of '
            'amino acids plus beneficial microorganisms to stimulate latex production and disease resistance.'
        ),
        'desc_km': (
            'ជីធម្មជាតិ វីហ្គីប យអូឡាតិ គឺជាជីធម្មជាតិបច្ចេកវិទ្យាថ្មីដែលត្រូវបានរចនា '
            'ឡើងយ៉ាងពិសេសសម្រាប់ដំណាំកៅស៊ូ។ វាផ្តល់នូវម៉ាក្រូសារធាតុ (NPK ម៉ាញ៉េស្យូម) '
            'មីក្រូសារធាតុ អាស៊ីតអាមីណូ ១៨ ប្រភេទ និងអតិសុខុមប្រាណ '
            'ដើម្បីជំរុញការផលិតទឹកជ័រ និងការការពារជំងឺ។'
        ),
        'usage_instructions_en': (
            'Actively tapping: Mix 1L with 250–500L water, spray tree and roots every 1–2 months.\n'
            'Wintering & leaf flush: Mix 1L with 250–500L water, apply 1–2 times each phase.\n'
            'Treatment & rescue: Mix 1L with 250L water, apply every 1–2 weeks for 3–4+ times.\n'
            'Best applied early morning or cool afternoon.'
        ),
        'usage_instructions_km': (
            'កៅស៊ូកំពុងជៀរជ័រ: ជី ១L = ទឹក ២៥០-៥០០L បាញ់រៀងរាល់ ១-២ ខែ ម្តង។\n'
            'ត្រៀមតេត/លាស់ស្លឹកថ្មី: ជី ១L = ទឹក ២៥០-៥០០L '
            'បាញ់ ១-២ ដង ពេលត្រៀមតេត និង ១-២ ដង ពេលលាស់ស្លឹកថ្មី។\n'
            'ព្យាបាល/សង្គ្រោះ: ជី ១L = ទឹក ២៥០L បាញ់រាល់ ១-២ សប្តាហ៍ ម្តង ឲ្យបាន ៣-៤ ឡើងទៅ។'
        ),
        'nutrients_json': {
            'N': '0.72%', 'P2O5': '0.43%', 'K2O': '3.2%',
            'MgO': '1.89%', 'CaO': '0.36%', 'B': '100 ppm',
            'Fe': '50 ppm', 'Al': '<10 ppm', 'Cu': '<10 ppm',
            'Zn': '20 ppm', 'Mn': '<10 ppm',
            'AminoAcids': '18 types', 'Microorganisms': '~6.7x10^5 cfu/ml',
        },
    },
    {
        'id': 'b0000001-0000-0000-0000-000000000003',
        'name_en': 'Vigor BioControl',
        'name_km': 'ថ្នាំបង្ការជំងឺ',
        'category': 'Disease Control',
        'desc_en': (
            'Vigor BioControl is produced from natural and organic raw materials for protecting crops from '
            'fungal and bacterial diseases including leaf blight, leaf spots, anthracnose, black rot, root rot, '
            'fruit rot, powdery mildew, and downy mildew. Can be used on all crop types.'
        ),
        'desc_km': (
            'ជីធម្មជាតិ វីហ្គីប យអូខន់ត្រូល ត្រូវបានផលិតឡើងតាមរូបមន្ត '
            'និងវត្ថុធាតុដើមពីធម្មជាតិ ដើម្បីការពារដំណាំ '
            'ពីជំងឺជាច្រើន ដូចជាជំងឺផ្សិត ជំងឺរលកទងស្លឹក ផ្លែ '
            'អុតស្លឹក រលួយឫស រលួយផ្លែ និងបូសទឹក បូសខ្យល់ '
            'អាចប្រើបានលើគ្រប់ប្រភេទដំណាំ។'
        ),
        'usage_instructions_en': (
            'Fruit trees: Mix 1L with 500–1000L water, spray tree, leaves, branches, and base.\n'
            'Medium crops / seedlings: Mix 20–30ml with 20–25L water, spray thoroughly.\n'
            'Note: Rice may show increased yellowing after application — normal; new leaves emerge in 3–7 days.'
        ),
        'usage_instructions_km': (
            'ដំណាំឈើហូបផ្លែ: ១ លីត្រ លាយទឹក ៥០០-១០០០ លីត្រ '
            'បាញ់ឲ្យសើមសព្វដើម ស្លឹក មែក និងគល់ដំណាំ។\n'
            'ដំណាំមធ្យម/កូនដំណាំ: ២០-៣០ មល លាយទឹក ២០-២៥ លីត្រ '
            'បាញ់ឲ្យសើមសព្វ។\n'
            'ចំណាំ: ស្រូវវ អាចជួបករណីស្លឹកប្រែ ជាពណ៌លឿង ត្រួយថ្មីចេញ ជំនួស '
            'ក្នុង ៣-៧ ថ្ងៃ។'
        ),
        'nutrients_json': {
            'ActiveIngredient': 'Sulfur (S): 65 g/L',
            'OtherIngredients': '93.5%',
        },
    },
    {
        'id': 'b0000001-0000-0000-0000-000000000004',
        'name_en': 'Vigor BioBooster',
        'name_km': 'ជីបំប៉នសង្គ្រោះ',
        'category': 'Nutrient Rescue Booster',
        'desc_en': (
            'Vigor BioBooster is the first and only complete biotechnology product in Cambodia. It restores '
            'degraded soils and helps crops grow rapidly through 7 groups of beneficial microorganisms. '
            'Also rich in amino acids, fulvic acid, seaweed extract (Seaweed), NPK, and micro-nutrients '
            'to stimulate root growth and reduce reliance on chemical fertilizers.'
        ),
        'desc_km': (
            'វីហ្គីប យអូប៊ូស្ទ័រ ត្រូវបានផលិតឡើងដោយបច្ចេកវិទ្យាប យអូឡូជីពេញលេញ '
            'ដំបូងគេ និងតែមួយគត់ នៅប្រទេសកម្ពុជា។ '
            'វាអាចជួយឲ្យដីខូចរិចរិលត្រឡប់ មកមានគុណភាពល្អឡើងវិញ '
            'និងជួយដំណាំលូតលាស់លឿន និងមានសុខភាពល្អ '
            'តាមរយៈពពួកអតិសុខុមប្រាណ ៧ ក្រុម។'
        ),
        'usage_instructions_en': None,
        'usage_instructions_km': None,
        'nutrients_json': None,
    },
    {
        'id': 'b0000001-0000-0000-0000-000000000005',
        'name_en': 'Vigor BioGuard',
        'name_km': 'ថ្នាំការពារជំងឺ',
        'category': 'Natural Disease Prevention',
        'desc_en': (
            'Vigor BioGuard acts as a natural anti-disease and anti-pathogen agent containing many types of '
            'organic compounds, enhanced by beneficial bacteria groups including Bacillus and Streptomyces. '
            'These bacteria attack pathogens by cutting off food supply, cutting off oxygen, producing '
            'antibiotics, and attaching to harmful agents to neutralize them on all crop types.'
        ),
        'desc_km': (
            'វីហ្គីប យអូហ្គាដ ដើរតួជាថ្នាំប្រឆាំងជំងឺ និងមេរោគបែបធម្មជាតិ '
            'ដែលមានផ្ទុកសមាសធាតុសរីរាងជាច្រើនប្រភេទ '
            'និងត្រូវបានបង្កើនប្រសិទ្ធភាពដោយពពួក អតិសុខុមប្រាណ '
            'ក្រុមប យក់ស៊ីលើស ស ប់ ធីលីស '
            'ដើម្បីពង្រឹងសុខភាពដំណាំ ទប់ទល់នឹងភ្នាក់ងារ បង្កជំងឺ '
            'នៅលើគ្រប់ប្រភេទដំណាំ។'
        ),
        'usage_instructions_en': None,
        'usage_instructions_km': None,
        'nutrients_json': None,
    },
    {
        'id': 'b0000001-0000-0000-0000-000000000006',
        'name_en': 'Vigor BioCombat',
        'name_km': 'ថ្នាំការពារសត្វល្អិត',
        'category': 'Insect Pest Control',
        'desc_en': (
            'Vigor BioCombat uses French technology and Bacillus thuringiensis microorganisms to protect '
            'crops from caterpillars, ants, aphids, thrips, leaf miners, and beetles without harming '
            'beneficial insects, humans, animals, or the environment. When insects consume the BT protein, '
            'their digestive system stops and they die shortly after.'
        ),
        'desc_km': (
            'វីហ្គីប យអូខ ំប ត ត្រូវបានផលិតដោយ បច្ចេកវិទ្យាបារាំង '
            'ដោយប្រើ ប.ធីរីងហ្គីនស៊ីស ដើម្បីការពារ ដំណាំ '
            'ពីដង្កូវ មេអំបៅ ស មមាចត្នោត មូសតែ '
            'និងសត្វ ល្អិតចង្រៃ ជាច្រើន ប្រភេទ '
            'ដោយ មិន ប ង្ក ផ ល ព ល់ ដ ល់ ស ត្វ ល្អិ ត ល្អ '
            'មនុស្ស ស ត្វ ឬ បរិ ស្ថ ន ។'
        ),
        'usage_instructions_en': None,
        'usage_instructions_km': None,
        'nutrients_json': None,
    },
    {
        'id': 'b0000001-0000-0000-0000-000000000007',
        'name_en': 'Vigor BioGo',
        'name_km': 'ជីកែដី',
        'category': 'Soil Amendment',
        'desc_en': (
            'Vigor BioGo is the best for improving soil quality and restoring soil vitality. It stimulates '
            'crop root system growth and helps soil retain water and nutrients through many beneficial '
            'microorganisms. Breaks up compact soil for better water and air infiltration. Also contains '
            'NPK, micro-nutrients, fulvic acid, seaweed extract, and amino acids.'
        ),
        'desc_km': (
            'វីហ្គីប យអូហ្គោ ល្អបំផុតសម្រាប់ការ កែ ប្រែ គុ ណ ភា ព ដី '
            'ឲ្យ ល្អ ប្រ សើ រ និ ង មា ន ជីវ ជា តិ ឡើ ង វិ ញ '
            'និ ង ជំ រុ ញ ការ លូ ត លា ស់ ប្រ ព័ ន្ធ ឫ ស ដំ ណ ំ '
            'ជួ យ ឲ្យ ដី ផ្ទុ ក ទឹ ក និ ង ស រ ធ តុ ចិ ញ្ចឹ ម ។ '
            'វ ក់ ម ន ផ្ទុ ក ផ ង ដែ រ NPK មី ក្រ ូ ស រ ធ តុ '
            'ហ្វូ លវិ ក អ ស៊ី ត ស រ ៉ ាយ ស មុ ទ្រ '
            'និ ង អ មី ណូ អ ស៊ី ត ។'
        ),
        'usage_instructions_en': None,
        'usage_instructions_km': None,
        'nutrients_json': None,
    },
]


def upgrade() -> None:
    op.create_table(
        'products',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('profile_id', sa.UUID(), nullable=True),
        sa.Column('image_url', sa.Text(), nullable=True),
        sa.Column('name_en', sa.String(255), nullable=False),
        sa.Column('name_km', sa.String(255), nullable=True),
        sa.Column('desc_en', sa.Text(), nullable=True),
        sa.Column('desc_km', sa.Text(), nullable=True),
        sa.Column('price', sa.String(50), nullable=True),
        sa.Column('category', sa.String(100), nullable=True),
        sa.Column('usage_instructions_en', sa.Text(), nullable=True),
        sa.Column('usage_instructions_km', sa.Text(), nullable=True),
        sa.Column('nutrients_json', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['profile_id'], ['profiles.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_products_profile_id', 'products', ['profile_id'])

    # Seed Vigor 8 Living Soil supplier profile
    # Use literal SQL to avoid asyncpg type inference issues with UUID and enum columns
    op.execute("""
        INSERT INTO profiles (
            id, type, name_en, name_km, bio_en, bio_km,
            job_title_en, job_title_km, location_en, location_km,
            telegram, online, is_active, created_at, updated_at
        ) VALUES (
            'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
            'SUPPLIER'::profiletype,
            'Vigor 8 Living Soil',
            'វីហ្គីប៉ាយ ៨',
            'Cambodia''s leading biotechnology-based natural fertilizer brand, offering a full range of bio-organic products designed to maximize crop yields while reducing chemical dependency. Products are produced from natural, non-toxic ingredients certified safe for the environment, crops, and farmers.',
            'ម៉ាកជីធម្មជាតិបយអូទេកណូឡូជីលំដប់មួយនៅប្រទេសកម្ពុជា ដែលផ្តល់ផលិតផលជីធម្មជាតិ ពេញលេញ មានបញ្ជី ដើម្បីជំរុញទិន្នផលដំណាំ ខណៈពេលកាត់បន្ថយការប្រើថ្នាំគីមី។ ផលិតផលត្រូវបានផលិត ពីសមាសធាតុធម្មជាតិ គ្មានជាតិពុល ទទួលស្គាល់ ព័ ន្ ធ ។',
            'Certified Agro Supplier',
            'អ្នកផ្គត់ផ្គង់កសិកម្ម',
            'Phnom Penh, Cambodia',
            'ភ្នំពេញ ប្រទេសកម្ពុជា',
            'vigor8_kh',
            false,
            true,
            '2026-05-05T00:00:00+00:00'::timestamptz,
            '2026-05-05T00:00:00+00:00'::timestamptz
        ) ON CONFLICT (id) DO NOTHING
    """)

    # Seed 7 Vigor products
    products_table = sa.table(
        'products',
        sa.column('id', sa.UUID()),
        sa.column('profile_id', sa.UUID()),
        sa.column('name_en', sa.String()),
        sa.column('name_km', sa.String()),
        sa.column('category', sa.String()),
        sa.column('desc_en', sa.Text()),
        sa.column('desc_km', sa.Text()),
        sa.column('usage_instructions_en', sa.Text()),
        sa.column('usage_instructions_km', sa.Text()),
        sa.column('nutrients_json', sa.JSON()),
        sa.column('image_url', sa.Text()),
        sa.column('price', sa.String()),
        sa.column('created_at', sa.DateTime(timezone=True)),
        sa.column('updated_at', sa.DateTime(timezone=True)),
    )
    op.bulk_insert(products_table, [
        {**p, 'profile_id': VIGOR_PROFILE_ID, 'image_url': None, 'price': None,
         'created_at': _NOW, 'updated_at': _NOW}
        for p in _PRODUCTS
    ])


def downgrade() -> None:
    op.execute(f"DELETE FROM products WHERE profile_id = '{VIGOR_PROFILE_ID}'")
    op.execute(f"DELETE FROM profiles WHERE id = '{VIGOR_PROFILE_ID}'")
    op.drop_index('ix_products_profile_id', table_name='products')
    op.drop_table('products')
