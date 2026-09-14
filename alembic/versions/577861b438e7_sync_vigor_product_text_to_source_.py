"""sync vigor product text to source document

Revision ID: 577861b438e7
Revises: 1e75be5192d5
Create Date: 2026-09-14 22:02:11.301864

Replaces corrupted/incomplete product name_km, desc_en, desc_km, and adds
usage_instructions_en/km + category_km, sourced verbatim from the project's
real Vigor product catalog (FYP.docx / FYP.pdf). The prior seed migration
(3f8a1c9b2d45) had several Khmer descriptions corrupted with stray
inter-syllable spaces (likely copy-pasted from a broken PDF text render
rather than the source DOCX).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '577861b438e7'
down_revision: Union[str, Sequence[str], None] = '1e75be5192d5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_BIOYIELD   = 'b0000001-0000-0000-0000-000000000001'
_BIOLATEX   = 'b0000001-0000-0000-0000-000000000002'
_BIOCONTROL = 'b0000001-0000-0000-0000-000000000003'
_BIOBOOSTER = 'b0000001-0000-0000-0000-000000000004'
_BIOGUARD   = 'b0000001-0000-0000-0000-000000000005'
_BIOCOMBAT  = 'b0000001-0000-0000-0000-000000000006'
_BIOGO      = 'b0000001-0000-0000-0000-000000000007'

_UPDATES = [
    {
        'id': _BIOYIELD,
        'name_km': 'វីហ្គី បាយអូមហាផល',
        'desc_en': (
            'Vigor BioYield+ is a smart choice for farmers who want to maximize their crop yields at low cost. '
            'This special formula is designed to stimulate more flowering and fruiting with high quality, by '
            'improving the efficiency of nutrient absorption and utilization to reduce spending on chemical '
            'fertilizers and pesticides. It not only helps crops produce more flowers and high-quality fruits, '
            'but also helps improve soil vitality, replenishes soil microorganisms, and maintains soil pH '
            'balance for better, healthier plant growth and higher yields. It is formulated from natural, '
            'non-toxic ingredients to ensure safety for the environment, crops, and farmers.'
        ),
        'desc_km': (
            'វីហ្គី បាយអូមហាផល គឺជាជម្រើស ដ៏ឆ្លាតវៃសម្រាប់កសិករ ដែលចង់បង្កើនទិន្នផល '
            'ដំណាំរបស់ខ្លួនឲ្យតែខ្ពស់ ដោយការចំណាយទុន តិចសម្រាប់ការធ្វើកសិកម្ម។ រូបមន្តពិសេសនេះត្រូវ '
            'បានរចនាឡើង ដើម្បីជំរុញការចេញផ្កា និងផ្លែច្រើន ប្រកដោយគុណភាពខ្ពស់ តាមរយៈការបង្កើនប្រសិទ្ធ '
            'ភាពនៃការស្រូបយក និងប្រើប្រាស់សារធាតុចិញ្ចឹម របស់ដំណាំឲ្យអស់លទ្ធភាពដើម្បីបន្ថយការចំណាយ '
            'ច្រើនលើជី និងថ្នាំគីមីកសិកម្ម។ វាមិនត្រឹមតែជួយ ឱ្យដំណាំចេញផ្កាច្រើន និងផ្លែមានគុណភាពល្អ '
            'ប៉ុណ្ណោះទេ ប៉ុន្តែក៏ជួយកែប្រែដីឱ្យមានជីវជាតិ ជួយ ឱ្យដីផុស សំបូរដោយជីវចម្រុះឡើងវិញ និងរក្សា '
            'តុល្យភាពប៉េហាស់ដី (pH) ដើម្បីដំណាំលូតលាស់ កាន់តែប្រសើរ សុខភាពល្អរឹងមាំ និងបង្កើនទិន្នផល '
            'បានកាន់តែខ្ពស់។ វាត្រូវបានផ្សំឡើងពីសមាសធាតុ ផ្សំប្រភពពីធម្មជាតិ គ្មានជាតិពុល ដើម្បីធានាបាន '
            'សុវត្ថិភាពទាំងបរិស្ថាន ផលដំណាំ និងកសិករផ្ទាល់។'
        ),
        'usage_instructions_en': (
            'Fruit trees (Durian, Mangosteen): Stimulates root growth, new shoots, flowering, and fruiting. '
            'Mix 1L with 250–500L water, spray to thoroughly wet crops and soil under the plant.\n'
            'Medium crops (Rice, Cassava): Stimulates new roots, shoots, flowering, and fruiting. Mix 100ml '
            'with 20–25L water, spray to wet all crops. Apply 3–4 times per season.\n'
            'Rotation crops, seedlings, or leafy vegetables: Boosts and stimulates growth. Mix 50–70ml with '
            '20–25L water, spray every 5–7 days. Can increase to 100ml for larger crops.\n'
            'Note: Can be applied before or after granular fertilizer. Best applied in the early morning, '
            'cool afternoon, or after rainfall. Consult detailed usage guidelines for each crop or a '
            'technician before use.'
        ),
        'usage_instructions_km': (
            'ដំណាំឈើហូបផ្លែ (ទុរេន ស្វាយចន្ទី): ជំរុញការលូតលាស់ ឫស ត្រួយ ផ្កា ផ្លែ។ ប្រើជី ១ លីត្រ '
            'លាយជាមួយទឹក ២៥០-៥០០ លីត្រ បាញ់ឲ្យសើមសព្វដំណាំ និងដីក្រោមដើម។\n'
            'ដំណាំមធ្យម (ស្រូវ ឬដំឡូងមី): ជំរុញឫស ត្រួយថ្មី ផ្កា ផ្លែ។ ប្រើជី ១០០ មល លាយជាមួយទឹក '
            '២០-២៥ លីត្រ បាញ់ឲ្យសើមសព្វដំណាំ។ បាញ់ ៣-៤ ដង/រដូវ។\n'
            'ដំណាំវិលជុំ កូនដំណាំ ឬបន្លែស្លឹក: បំប៉នជំរុញការលូតលាស់។ ប្រើជី ៥០-៧០ មល លាយជាមួយទឹក '
            '២០-២៥ លីត្រ បាញ់ឲ្យសព្វលើដំណាំ រាល់ ៥-៧ ថ្ងៃម្តង។ ដំណាំកាន់តែធំអាចបង្កើនដល់ ១០០ មល។\n'
            'ចំណាំ: អាចបាញ់មុន ឬក្រោយដាក់ជីគ្រាប់ក៏បាន។ គួរបាញ់ពេលព្រឹកព្រលឹម រសៀលត្រជាក់ និងក្រោយពេល'
            'ភ្លៀងធ្លាក់កាន់តែល្អ។ សូមសួរកម្មវិធីប្រើប្រាស់លម្អិតសម្រាប់ដំណាំនីមួយៗ ឬប្រឹក្សាជាមួយ'
            'អ្នកបច្ចេកទេស មុននឹងប្រើ។'
        ),
        'category_km': 'អធិរាជទិន្នផល',
    },
    {
        'id': _BIOLATEX,
        'name_km': 'វីហ្គី បាយអូមហាជ័រ',
        'desc_en': (
            'Vigor BioLatex is a new-technology natural fertilizer specially designed for rubber trees. It '
            'provides essential nutrients including macro-nutrients (NPK, Magnesium) and many natural '
            'micro-nutrients, along with up to 18 types of amino acids, plus specially beneficial '
            'microorganisms, to support rubber tree health, stimulate disease prevention and treatment '
            'effectively. Its main benefits include stimulating more latex production, helping rubber trees '
            'resist various diseases caused by pathogens. Furthermore, it helps crops withstand climate '
            'changes such as drought or severe moisture stress, and helps reduce reliance on synthetic '
            'chemicals to a minimum. Regular use keeps rubber trees healthy, increases latex production, and '
            'protects them from various diseases.'
        ),
        'desc_km': (
            'វីហ្គី បាយអូមហាជ័រ គឺជាជីធម្មជាតិ បច្ចេកវិទ្យាថ្មី ដែលត្រូវបានរចនាឡើងយ៉ាងពិសេស '
            'សម្រាប់ដំណាំកៅស៊ូ។ វានេះផ្តល់នូវសារធាតុចិញ្ចឹម សំខាន់ៗដូចជា ម៉ាក្រូសារធាតុ (អិនប៉េកា '
            'ម៉ាញ៉េស្យូម) និងមីក្រូសារធាតុប្រភពពីធម្មជាតិជាច្រើន រួមជាមួយអាស៊ីតអាមីណូដល់ទៅ ១៨ ប្រភេទ '
            'ពិសេស ពពួកមីក្រូសារពាង្គកាយមានប្រយោជន៍ជាច្រើន ដើម្បីទ្រទ្រង់សុខភាពកៅស៊ូឱ្យរឹងមាំ '
            'ជំរុញការការពារ និងព្យាបាលជំងឺកៅស៊ូយ៉ាងមានប្រសិទ្ធភាព។ អត្ថប្រយោជន៍ចម្បងរបស់វា '
            'គឺជួយជំរុញការផលិត ទឹកជ័របានកាន់តែច្រើន ជួយឱ្យដើមកៅស៊ូមានភាពធន់នឹងជម្ងឺផ្សេងៗ​'
            'ដែលបង្កឡើងដោយភ្នាក់ងារចម្លងរោគនានា។ លើសពីនេះ វាជួយឱ្យដំណាំធន់នឹងការប្រែប្រួលអាកាសធាតុ '
            'ដូចជាបញ្ហារាំងស្ងួត ឬសំណើមធ្ងន់ធ្ងរ និងជួយកាត់បន្ថយការពឹងផ្អែក លើគីមីសំយោគឲ្យបានជាអតិបរមា។ '
            'ប្រើប្រាស់ជាប្រចាំ ដើម្បីកៅស៊ូកាន់តែមានសុខភាព កំណើនទឹកជ័រ និងការពារកៅស៊ូពីជំងឺផ្សេងៗ។'
        ),
        'usage_instructions_en': (
            'Actively tapping: Mix 1L with 250–500L water, spray tree and root area every 1–2 months. '
            'Stimulates latex production and strengthens rubber tree health.\n'
            'Preparing for wintering & new leaf flush: Mix 1L with 250–500L water, spray tree and root area '
            '1–2 times before wintering and 1–2 times during new leaf flush. Restores strength during '
            'wintering and opening season.\n'
            'Treatment & rescue: Mix 1L with 250L water, spray tree and root area every 1–2 weeks for 3–4+ '
            'times. Boosts resistance to pathogens and accelerates bark growth and recovery.\n'
            'Note: Best applied in the early morning or cool afternoon, and after rainfall. Consult detailed '
            'usage guidelines for each crop type or a technician before use.'
        ),
        'usage_instructions_km': (
            'កៅស៊ូកំពុងជៀរជ័រ: ជី ១L = ទឹក ២៥០-៥០០L បាញ់សព្វដើម និងតំបន់ឫស រៀងរាល់ ១-២ ខែម្តង។ '
            'ជំរុញកំណើនទឹកជ័រ និងពង្រឹងសុខភាពកៅស៊ូ។\n'
            'ត្រៀមតេត និងលាស់ស្លឹកថ្មី: ជី ១L = ទឹក ២៥០-៥០០L បាញ់សព្វដើម និងតំបន់ឫស ១-២ ដងពេលត្រៀមតេត '
            'និង ១-២ ដងពេលលាស់ស្លឹកថ្មី។ ស្តារកម្លាំង និងពង្រឹងសុខភាពកៅស៊ូ។\n'
            'ព្យាបាល និងសង្គ្រោះកៅស៊ូ: ជី ១L = ទឹក ២៥០L បាញ់សព្វដើម និងតំបន់ឫស រាល់ ១-២ សប្តាហ៍ម្តង '
            'ឲ្យបាន ៣-៤ ឡើងទៅ។ ជំរុញភាពធន់នឹងភ្នាក់ងារបង្ករោគ និងពន្លឿនការដុះសម្បកថ្មី។\n'
            'ចំណាំ: គួរបាញ់ពេលព្រឹកព្រលឹម ឬរសៀលត្រជាក់ និងក្រោយពេលភ្លៀងធ្លាក់កាន់តែល្អ។ សូមសួរកម្មវិធី'
            'ប្រើប្រាស់លម្អិតទៅតាមប្រភេទដំណាំ ឬប្រឹក្សាជាមួយអ្នកបច្ចេកទេស មុននឹងប្រើ។'
        ),
        'category_km': 'អធិរាជកៅស៊ូ',
    },
    {
        'id': _BIOCONTROL,
        'name_km': 'វីហ្គី បាយអូខន់ត្រូល',
        'desc_en': (
            'Vigor BioControl is produced from a new recipe using natural and organic raw materials that '
            'have been in use for centuries, for protecting crops from many types of diseases caused by '
            'harmful fungi and bacteria such as fungal disease, leaf and fruit blight, leaf spots, '
            'anthracnose, black rot, root rot, fruit rot, powdery mildew, downy mildew, and can be used on '
            'all crop types including water vegetables, leafy greens, rice, cucumber, durian, mangosteen and '
            'many others. In addition, it also provides some essential nutrients to stimulate crop growth '
            'and quickly restore crops to good health. It has been widely used and supported by farmers '
            'around the world for many years.'
        ),
        'desc_km': (
            'វីហ្គី បាយអូខន់ត្រូល ត្រូវបានផលិតឡើងតាមរូបមន្ត និងវត្ថុធាតុដើមពីធម្មជាតិ '
            'ដែលត្រូវបានគេប្រើប្រាស់រាប់សតវត្សកន្លងមកហើយ សម្រាប់ការពារដំណាំពីជំងឺជាច្រើនប្រភេទ '
            'ដែលបង្ករឡើងដោយពពួកផ្សិត និងបាក់តេរីអាក្រក់ដូចជា ជំងឺផ្សិត ជំងឺរលាកទងស្លឹក ផ្លែ អុតស្លឹក '
            'អុតគ្រាប់ ខ្មៅគ្រាប់ រលួយឬស រលួយផ្លែ បូសទឹក បូសខ្យល់ជាដើម និងអាចប្រើបានលើគ្រប់ប្រភេទដំណាំ'
            'រួមទាំងបន្លែលើទឹក បន្លែស្លឹក ស្រូវ ត្រសក់ ទុរេន ស្វាយចន្ទី និងដំណាំដទៃជាច្រើនទៀត។ '
            'បន្ថែមពីនេះវាក៏បានផ្តល់ឲ្យដំណាំ នូវសារធាតុចិញ្ចឹមចាំបាច់មួយចំនួន ដើម្បីជំរុញដល់ការលូតលាស់'
            'របស់ដំណាំ និង សង្គ្រោះដំណាំឲ្យត្រឡប់មកមានសុខភាពល្អឡើងវិញយ៉ាងឆាប់រហ័ស។ '
            'វាក៏ទទួលបានការនិយមគាំទ្រប្រើប្រាស់ដោយកសិករ នៅជុំវិញពិភពលោកអស់រយៈកាលជាច្រើនឆ្នាំកន្លងមកហើយ។'
        ),
        'usage_instructions_en': (
            'Fruit trees (Durian, Mangosteen): Mix 1L with 500–1,000L water, spray to thoroughly wet the '
            'tree, leaves, branches, and base. Or spray soil for root disease problems.\n'
            'Medium crops (Rice, Cassava): Mix 20–30ml with 20–25L water, spray to thoroughly wet all crops.\n'
            'Rotation crops, seedlings, or leafy vegetables: Mix 20–30ml with 20–25L water, spray to '
            'thoroughly wet all crops.\n'
            'Note: After spraying, some crops — especially rice — may show increased yellowing of leaves. '
            'This is normal; new healthy leaves emerge within 3–7 days. Consult detailed usage guidelines or '
            'a technician before use.'
        ),
        'usage_instructions_km': (
            'ដំណាំឈើហូបផ្លែ (ទុរេន ស្វាយចន្ទី): ១ លីត្រ លាយជាមួយទឹក ៥០០-១០០០ លីត្រ បាញ់ឲ្យសើមសព្វដើម '
            'ស្លឹក មែក និងគល់ដំណាំ ឬបាញ់ឲ្យសើមសព្វដីសម្រាប់បញ្ហាជំងឺឫស។\n'
            'ដំណាំមធ្យម (ស្រូវ ឬដំឡូងមី): ២០-៣០ មល លាយជាមួយទឹក ២០-២៥ លីត្រ បាញ់ឲ្យសើមសព្វលើដំណាំ។\n'
            'ដំណាំវិលជុំ កូនដំណាំ ឬបន្លែស្លឹក: ២០-៣០ មល លាយជាមួយទឹក ២០-២៥ លីត្រ បាញ់ឲ្យសើមសព្វលើដំណាំ។\n'
            'ចំណាំ: ក្រោយបាញ់រួច ដំណាំមួយចំនួន ពិសេសស្រូវ អាចជួបករណីស្លឹកប្រែជាពណ៌លឿងច្រើនជាងមុន '
            'នេះជាដំណើរការធម្មតា ត្រួយថ្មីនឹងចេញជំនួសវិញ ក្នុងរយៈពេល ៣-៧ ថ្ងៃ។ សូមសួរកម្មវិធីប្រើប្រាស់'
            'លម្អិត ឬប្រឹក្សាជាមួយអ្នកបច្ចេកទេស មុននឹងប្រើ។'
        ),
        'category_km': 'អធិរាជគ្រប់គ្រងជំងឺ',
    },
    {
        'id': _BIOBOOSTER,
        'name_km': 'វីហ្គី បាយអូប៊ូស្ទ័រ',
        'desc_en': (
            'Vigor BioBooster is the first and only complete biotechnology-produced product in Cambodia. It '
            'has become an indispensable partner for farmers in many countries, as it can restore degraded '
            'soils to good quality and helps crops grow rapidly and healthily through its 7 groups of '
            'beneficial microorganisms. In addition to these powerful beneficial microorganisms, it is also '
            'rich in amino acids, fulvic acid, seaweed extract (Seaweed), NPK, and many micro-nutrients to '
            'help stimulate crop root system growth, support nutrient absorption from the soil, help crops '
            'withstand adverse weather, and give the highest possible yields. It especially helps farmers '
            'reduce the use of chemical fertilizers and pesticides to a minimum, cutting costs and ensuring '
            'farmer health.'
        ),
        'desc_km': (
            'វីហ្គី បាយអូប៊ូស្ទ័រ ត្រូវបានផលិតឡើងដោយបច្ចេកវិទ្យាបាយអូឡូជីពេញលេញ ដំបូងគេ និងតែមួយគត់ '
            'នៅប្រទេសកម្ពុជាយើង។ វីហ្គី បាយអូប៊ូស្ទ័រ បានក្លាយជាដៃគូមិនអាចខ្វះបាន '
            'របស់កសិករនៅតាមបណ្តាប្រទេសជាច្រើន ដោយសារវាអាចជួយឲ្យដី ដែលខូចរិចរិល ត្រឡប់មកមាន '
            'គុណភាពល្អឡើងវិញ និងជួយឲ្យដំណាំមានសន្ទុះលូតលាស់លឿន សុខភាពល្អរឹងមាំ '
            'តាមរយៈពពួកអតិសុខុមប្រាណមានប្រយោជន៍ទាំង ៧ក្រុមរបស់វា។ បន្ថែមលើពពួកអតិសុខុមប្រាណដ៏មាន'
            'ប្រយោជន៍ មហាសាលទាំងនោះ វាក៏សំបូរដោយអាមីណូអាស៊ីត ហុលវិកអាស៊ីត សារ៉ាយសមុទ្រស៊ីវីដ អិនប៉េកា '
            'និងមីក្រូសារធាតុជាច្រើន ដើម្បីជួយជំរុញការលូតលាស់ប្រព័ន្ធឬសរបស់ដំណាំ ជំនួយដល់ដំណាំក្នុងការ'
            'បឺតស្រូបជីវជាតិពីក្នុងដី ជួយដល់ការរំលាយ និងបំលែងជីនៅក្នុងដី ព្រមទាំងជួយឲ្យដំណាំធន់ទៅនឹង'
            'អាកាសធាតុមិនល្អ ដើម្បីដំណាំផ្តល់ទិន្នផលខ្ពស់ ជាពិសេសជួយឲ្យកសិករកាត់បន្ថយការប្រើប្រាស់ជីគីមី '
            'និងថ្នាំគីមីផ្សេងៗឲ្យនៅតិចបំផុត ដើម្បីកាត់បន្ថយការចំណាយ និងសុវត្ថិភាពដល់សុខភាពរបស់កសិករ។'
        ),
        'category_km': 'អធិរាជបំប៉នសង្គ្រោះ',
    },
    {
        'id': _BIOGUARD,
        'name_km': 'វីហ្គី បាយអូហ្គាដ',
        'desc_en': (
            'Vigor BioGuard acts as a natural anti-disease and anti-pathogen agent containing many types of '
            'organic compounds, enhanced in effectiveness by groups of beneficial bacteria including '
            'Bacillus, Streptomyces, other beneficial microorganisms, and other beneficial fungal groups, to '
            'strengthen crop health against various disease-causing pathogens on all crop types. These '
            'beneficial bacteria attack pathogenic agents by cutting off food supply, cutting off oxygen, '
            'competing for space, producing antibiotics (pathogen-killing agents), and attaching themselves '
            'to harmful agents to neutralize them.'
        ),
        'desc_km': (
            'វីហ្គី បាយអូហ្គាដ ដើរតួនាទីជាថ្នាំប្រឆាំងជំងឺ និងមេរោគបែបធម្មជាតិ '
            'ដែលមានផ្ទុកនូវសមាសធាតុសរីរាងជាច្រើនប្រភេទ និងត្រូវបានបង្កើនប្រសិទ្ធភាពដោយពពួកអតិសុខុមប្រាណ'
            'មានប្រយោជន៍ ក្រុមបាក់ស៊ីលើស សាប់ធីលីស និងអតិសុខុមប្រាណល្អដទៃទៀត រួមជាមួយពពួកផ្សិតក្រុមល្អ'
            'ផ្សេងទៀត ដើម្បីពង្រឹងសុខភាពដំណាំទប់ទល់នឹងភ្នាក់ងារបង្កជំងឺផ្សេងៗនៅលើគ្រប់ប្រភេទដំណាំ។ '
            'ពពួកបាក់តេរីមានប្រយោជន៍ទាំងនេះនឹងធ្វើការវាយប្រហារភ្នាក់ងារបង្ករោគនានាតាមរបៀបការកាត់ផ្តាច់'
            'អាហារ ផ្តាច់អុកស៊ីសែន ដណ្ដើមតំបន់ឈរជើង ផលិតអង់ទីប៊ីយ៉ូទិក (ថ្នាំសម្លាប់មេរោគ) និងផ្ញើខ្លួន'
            'ទៅនឹងភ្នាក់ងារចង្រៃដើម្បីបន្សំពួកវា។'
        ),
        'category_km': 'អធិរាជការពារជំងឺ',
    },
    {
        'id': _BIOCOMBAT,
        'name_km': 'វីហ្គី បាយអូខាំបាត',
        'desc_en': (
            'Vigor BioCombat is produced using French technology, utilizing Bacillus thuringiensis '
            'microorganisms to protect crops from various harmful insects such as caterpillars, ants, '
            'aphids, thrips, leaf miners, beetles and many other pest insects, without harming beneficial '
            'insects, humans, animals or the environment. It also provides essential nutrients to nourish '
            'health and stimulate crop growth, same as Vigor BioGuard. These beneficial microorganisms '
            'attack pest insect groups by spreading BT protein onto crops. When insects consume this '
            'protein, their digestive system stops functioning and they die shortly after.'
        ),
        'desc_km': (
            'វីហ្គី បាយអូខាំបាត ត្រូវបានផលិតឡើងតាមបច្ចេកវិទ្យារបស់ប្រទេសបារាំងដោយប្រើប្រាស់ពពួកអតិសុខុម'
            'ប្រាណ បាក់ស៊ីលើស ធីរីងហ្គីនស៊ីស ដើម្បីការពារដំណាំពីពួកសត្វល្អិតចង្រៃផ្សេងៗ ដូចជា ដង្កូវ '
            'មេអំបៅស មមាចត្នោត មូសតែ និងសត្វល្អិតចង្រៃជាច្រើនប្រភេទទៀត ហើយវាមិនបង្កផលពាល់ដល់សត្វល្អិត'
            'មានប្រយោជន៍ មនុស្ស សត្វ និងបរិស្ថានឡើយ ប៉ុន្តែវាថែមទាំងផ្តល់សារធាតុចិញ្ចឹមចាំបាច់ '
            'ដើម្បីបំប៉នសុខភាព និងជំរុញការលូតលាស់ដល់ដំណាំ ដូចគ្នានឹងអធិរាជការពារជំងឺ វីហ្គី បាយអូហ្គាដ '
            'ដែរ។ ពពួកអតិសុខុមប្រាណមានប្រយោជន៍នេះ នឹងវាយប្រហារលើក្រុមសត្វល្អិតចង្រៃ តាមការពង្រាយនូវ'
            'ប្រូតេអ៊ីនប៊ីធីនៅលើដំណាំ ហើយនៅពេលសត្វល្អិតមកស៊ីប៉ះជាតិប្រូតេអ៊ីននេះ វានឹងធ្វើឲ្យប្រព័ន្ធ'
            'រំលាយអាហាររបស់សត្វល្អិតនោះលែងដំណើរការ ហើយវានឹងងាប់នៅពេលបន្ទាប់។'
        ),
        'category_km': 'អធិរាជការពារសត្វល្អិត',
    },
    {
        'id': _BIOGO,
        'name_km': 'វីហ្គី បាយអូហ្គោ',
        'desc_en': (
            'Vigor BioGo is the best for improving soil quality and restoring soil vitality, and stimulating '
            'crop root system growth, helping the soil retain water and nutrients well, as it contains many '
            'beneficial microorganisms. It helps break up compact soil to create space for water and air '
            'infiltration, to benefit the growth of microorganisms and the crop root system so crops can '
            'absorb nutrients well for healthy and strong crops. Additionally, it also contains essential '
            'nutrients such as NPK, micro-nutrients, fulvic acid, seaweed extract (Seaweed), and amino acids '
            'to provide nourishment and stimulate overall crop growth for healthy and high-yielding crops.'
        ),
        'desc_km': (
            'វីហ្គី បាយអូហ្គោ ល្អបំផុតសម្រាប់ការកែប្រែគុណភាពដីឲ្យល្អប្រសើរ និងមានជីវជាតិឡើងវិញ '
            'និងជំរុញការលូតលាស់ប្រព័ន្ធឬសដំណាំ ជួយឲ្យដីអាចផ្ទុកជាតិទឹក និងសារធាតុចិញ្ចឹមបានល្អ '
            'ដោយសារវាមានផ្ទុកនូវពពួកអតិសុខុមប្រាណមានប្រយោជន៍ជាច្រើន។ វាជួយបំបែកដីដែលរឹងក្តាំងឲ្យផុសធូរ '
            'បង្កើតជាលំហរដល់ការជ្រាបចូលនៃទឹក និងខ្យល់ ដើម្បីអំណោយផលការលូតលាស់នៃពពួកមីក្រូសារពាង្គកាយ'
            'នានា និងការលូតលាស់នៃប្រព័ន្ធឫសដំណាំ ដែលអាចឲ្យដំណាំស្រូបយកសារធាតុចិញ្ចឹមបានល្អ ដំណាំមាន'
            'សុខភាពល្អ និងរឹងមាំ។ បន្ថែមពីលើពីនេះ វាក៏មានផ្ទុកផងដែរនូវសារធាតុចិញ្ចឹមចាំបាច់ដូចជា '
            'អិនប៉េកា មីក្រូសារធាតុ ហ្វូលវិកអាស៊ីត សារ៉ាយសមុទ្រស៊ីវីដ និងអាមីណូអាស៊ីត សម្រាប់ផ្តល់'
            'សារធាតុចិញ្ចឹម ប៉ូវបំប៉ន និងជំរុញការលូតលាស់របស់ដំណាំទាំងមូល ដើម្បីដំណាំមានសុខភាពល្អ '
            'ទិន្នផលខ្ពស់។'
        ),
        'category_km': 'អធិរាជកែដី',
    },
]


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('products', sa.Column('category_km', sa.String(100), nullable=True))

    products_table = sa.table(
        'products',
        sa.column('id', sa.UUID()),
        sa.column('name_km', sa.String()),
        sa.column('desc_en', sa.Text()),
        sa.column('desc_km', sa.Text()),
        sa.column('usage_instructions_en', sa.Text()),
        sa.column('usage_instructions_km', sa.Text()),
        sa.column('category_km', sa.String()),
    )

    for row in _UPDATES:
        values = {k: v for k, v in row.items() if k != 'id'}
        op.execute(
            products_table.update()
            .where(products_table.c.id == row['id'])
            .values(**values)
        )


def downgrade() -> None:
    """Downgrade schema."""
    # Content fixes are not meaningfully reversible (the prior text was corrupted,
    # not worth restoring) — only the schema addition is reverted.
    op.drop_column('products', 'category_km')
