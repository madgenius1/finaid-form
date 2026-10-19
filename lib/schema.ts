// Single source of truth for the whole form.
// To add, remove or reword a question, edit this file only: the form screens,
// the review page, validation and the submission summary all read from it.

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Answers = Record<string, any>;

export type FieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'date'
  | 'number'
  | 'textarea'
  | 'radio'
  | 'select'
  | 'checkboxes'
  | 'consent';

export interface Field {
  id: string;
  label: string;
  type: FieldType;
  hint?: string;
  options?: string[];
  required?: boolean;
  placeholder?: string;
  showIf?: (a: Answers) => boolean;
}

export interface Column {
  id: string;
  label: string;
  type?: FieldType;
  options?: string[];
  placeholder?: string;
  /** include this column in the automatic total row */
  sum?: boolean;
}

export interface MatrixRow {
  id: string;
  label: string;
  hint?: string;
  /** overrides the column's type for this row */
  type?: FieldType;
  options?: string[];
  placeholder?: string;
  /** column ids that must be filled in for this row */
  requiredCols?: string[];
}

export type Block =
  | { kind: 'fields'; title?: string; note?: string; fields: Field[]; showIf?: (a: Answers) => boolean }
  | { kind: 'note'; text: string; showIf?: (a: Answers) => boolean }
  | {
      /** repeating entries shown as cards (colleges, dependants, loans...) */
      kind: 'table';
      id: string;
      title?: string;
      note?: string;
      columns: Column[];
      entryLabel: string;
      initialRows: number;
      maxRows: number;
      showIf?: (a: Answers) => boolean;
    }
  | {
      /** fixed rows x columns grid (income, assets, costs...) */
      kind: 'matrix';
      id: string;
      title?: string;
      note?: string;
      rowHeader?: string;
      rows: MatrixRow[];
      columns: Column[];
      totalRow?: boolean;
      showIf?: (a: Answers) => boolean;
    };

export interface Section {
  id: string;
  number?: string;
  title: string;
  intro?: string;
  showIf?: (a: Answers) => boolean;
  blocks: Block[];
  custom?: (a: Answers) => { key: string; label: string; message: string }[];
}

export const mk = (blockId: string, rowId: string, colId: string) => `${blockId}.${rowId}.${colId}`;

const YN = ['Yes', 'No'];
const DOC = ['Ready to attach', 'Will send later', 'Not available', 'N/A'];
const isSplit = (a: Answers) => ['Divorced', 'Separated'].includes(a.marital_status);

const P12: Column[] = [
  { id: 'p1', label: 'Parent 1' },
  { id: 'p2', label: 'Parent 2' },
];
const P12SUM: Column[] = [
  { id: 'p1', label: 'Parent 1', sum: true, placeholder: 'Amount' },
  { id: 'p2', label: 'Parent 2', sum: true, placeholder: 'Amount' },
];
const DOCCOL: Column = { id: 'doc', label: 'Document', type: 'select', options: DOC };

export const SECTIONS: Section[] = [
  /* ------------------------------------------------------------------ */
  {
    id: 'basics',
    title: 'Basic information',
    intro: 'A few details about this form before we begin.',
    blocks: [
      {
        kind: 'fields',
        fields: [
          { id: 'student_name', label: "Student's full name", type: 'text', required: true },
          { id: 'academic_year', label: 'Academic year applying for', type: 'text', required: true, placeholder: 'e.g. 2027–2028' },
          {
            id: 'currency',
            label: 'Currency used in this form',
            type: 'text',
            required: true,
            placeholder: 'e.g. KES',
            hint: 'Use this one currency for every amount in the form.',
          },
          { id: 'exchange_rate', label: 'Exchange rate to USD (if known)', type: 'text', placeholder: 'e.g. 1 USD = 129 KES' },
          { id: 'completed_by', label: 'Form completed by', type: 'text', required: true },
          { id: 'date_completed', label: 'Date completed', type: 'date', required: true },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: 'student',
    number: '1',
    title: 'About the student',
    blocks: [
      {
        kind: 'fields',
        fields: [
          { id: 'legal_name', label: 'Full legal name (as on passport)', type: 'text', required: true },
          { id: 'other_names', label: 'Other names used, if any', type: 'text' },
          { id: 'dob', label: 'Date of birth', type: 'date', required: true },
          { id: 'citizenship', label: 'Country of citizenship', type: 'text', required: true },
          { id: 'passport_number', label: 'Passport number', type: 'text' },
          { id: 'passport_expiry', label: 'Passport expiry date', type: 'date' },
          { id: 'residence_country', label: 'Country of residence', type: 'text' },
          { id: 'residence_years', label: 'How long has the student lived there?', type: 'text', placeholder: 'e.g. 17 years' },
          { id: 'student_email', label: "Student's email address", type: 'email', required: true },
          { id: 'student_phone', label: "Student's phone number", type: 'tel' },
          { id: 'school', label: 'Current school', type: 'text' },
          { id: 'school_class', label: 'Class or year', type: 'text' },
          { id: 'school_grad', label: 'Expected date of graduation from current school', type: 'date' },
          { id: 'intended_start', label: 'Intended start term and year at college', type: 'text', required: true, placeholder: 'e.g. Fall 2027' },
          { id: 'prior_aid', label: 'Has the student received financial aid from a college before?', type: 'radio', options: YN },
        ],
      },
      {
        kind: 'table',
        id: 'colleges',
        title: 'Colleges the student is applying to',
        note: "The CSS Profile asks you to choose each college by its school code. Codes and deadlines are on each college's financial aid page.",
        entryLabel: 'College',
        initialRows: 3,
        maxRows: 12,
        columns: [
          { id: 'name', label: 'College' },
          { id: 'code', label: 'CSS school code' },
          { id: 'round', label: 'Application round', type: 'select', options: ['Early', 'Regular'] },
          { id: 'profile_deadline', label: 'CSS Profile deadline', type: 'date' },
          { id: 'docs_deadline', label: 'Documents deadline', type: 'date' },
          { id: 'coa', label: 'Cost of attendance, if known' },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: 'parents',
    number: '2',
    title: 'The parents',
    intro:
      'Use "Parent 1" and "Parent 2" for the two parents or legal guardians. If there is a stepparent, give their details in the "Stepparent / other" column. If you choose Divorced or Separated below, an extra section about the other parent will appear.',
    blocks: [
      {
        kind: 'matrix',
        id: 'parents',
        rowHeader: 'Detail',
        columns: [
          { id: 'p1', label: 'Parent 1' },
          { id: 'p2', label: 'Parent 2' },
          { id: 'other', label: 'Stepparent / other (if any)' },
        ],
        rows: [
          { id: 'name', label: 'Full legal name', requiredCols: ['p1'] },
          { id: 'relationship', label: 'Relationship to the student' },
          { id: 'dob', label: 'Date of birth', type: 'date' },
          { id: 'citizenship', label: 'Country of citizenship' },
          { id: 'residence', label: 'Country of residence' },
          { id: 'phone', label: 'Phone number', type: 'tel' },
          { id: 'email', label: 'Email address', type: 'email' },
          { id: 'address', label: 'Home address', type: 'textarea' },
          { id: 'education', label: 'Highest level of education completed' },
          { id: 'occupation', label: 'Occupation or job title' },
          { id: 'living', label: 'Is this person living?', type: 'radio', options: YN },
        ],
      },
      {
        kind: 'fields',
        title: "Parents' marital status",
        fields: [
          {
            id: 'marital_status',
            label: 'Current status',
            type: 'radio',
            required: true,
            options: ['Married', 'Remarried', 'Divorced', 'Separated', 'Widowed', 'Never married / unmarried'],
          },
          {
            id: 'split_details',
            label: 'Date of divorce or separation, and which parent has legal custody',
            type: 'textarea',
            showIf: isSplit,
          },
          { id: 'lived_with', label: 'With which parent did the student live for most of the last 12 months?', type: 'text' },
          { id: 'support_paid', label: 'Does the other parent pay support (maintenance) for the student? How much per year?', type: 'text' },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: 'other_parent',
    number: '3',
    title: 'Parent who does not live with the student',
    showIf: isSplit,
    intro:
      'Many colleges require a separate CSS Profile from this parent. If that is not possible, explain below, as colleges may allow a waiver in some situations.',
    blocks: [
      {
        kind: 'fields',
        fields: [
          { id: 'op_name', label: 'Full legal name', type: 'text' },
          { id: 'op_relationship', label: 'Relationship to the student', type: 'text' },
          { id: 'op_address', label: 'Home address', type: 'textarea' },
          { id: 'op_phone', label: 'Phone number', type: 'tel' },
          { id: 'op_email', label: 'Email address', type: 'email' },
          { id: 'op_occupation', label: 'Occupation and employer', type: 'text' },
          { id: 'op_income', label: 'Approximate yearly income (last year)', type: 'text' },
          { id: 'op_remarried', label: 'Is this parent remarried? Name of spouse', type: 'text' },
          { id: 'op_profile', label: 'Will this parent complete their own CSS Profile?', type: 'radio', options: YN },
          {
            id: 'op_why_not',
            label: 'If not, explain why',
            type: 'textarea',
            hint: 'For example: no contact, safety concerns, parent cannot be found.',
            showIf: (a) => a.op_profile === 'No',
          },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: 'household',
    number: '4',
    title: 'People in the household',
    blocks: [
      {
        kind: 'fields',
        fields: [
          { id: 'hh_size', label: 'Number of people in the household, including the student and both parents', type: 'number' },
          { id: 'hh_college', label: 'Number of those people attending college or university at least half-time next year (excluding parents)', type: 'number' },
        ],
      },
      {
        kind: 'table',
        id: 'dependents',
        title: 'Other people in the household',
        note: 'List everyone who lives with you or depends on you for more than half of their support, other than the parents.',
        entryLabel: 'Person',
        initialRows: 2,
        maxRows: 12,
        columns: [
          { id: 'name', label: 'Full legal name' },
          { id: 'relationship', label: 'Relationship to student' },
          { id: 'age', label: 'Age', type: 'number' },
          { id: 'lives_with', label: 'Lives with you?', type: 'select', options: YN },
          { id: 'supported', label: 'Do you pay their support?', type: 'select', options: YN },
          { id: 'studying', label: 'Studying?', type: 'select', options: ['No', 'School', 'College / university'] },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: 'siblings',
    number: '5',
    title: "Education costs for the student's siblings and other children",
    intro:
      'Include every child whose education you pay for, including primary and secondary school fees, and any child studying at college or university.',
    blocks: [
      {
        kind: 'table',
        id: 'children',
        entryLabel: 'Child',
        initialRows: 2,
        maxRows: 12,
        columns: [
          { id: 'name', label: "Child's name" },
          { id: 'relationship', label: 'Relationship to student' },
          { id: 'dob', label: 'Date of birth', type: 'date' },
          { id: 'school', label: 'School or college' },
          { id: 'class', label: 'Class or year in the coming year' },
          { id: 'cost', label: 'Yearly cost (tuition and fees)' },
          { id: 'scholarship', label: 'Scholarship or grant' },
          { id: 'paid', label: 'Amount you pay' },
        ],
      },
      {
        kind: 'fields',
        fields: [
          { id: 'sch_continues', label: "Is any child's scholarship or grant expected to continue next year?", type: 'radio', options: ['Yes', 'No', 'Not sure'] },
          { id: 'student_fees_last_year', label: "What did you pay for the student's own school fees last year?", type: 'text' },
          { id: 'student_scholarship_now', label: 'Does the student have a scholarship now? If yes, how much per year?', type: 'text' },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: 'work',
    number: '6',
    title: 'Work and business',
    blocks: [
      {
        kind: 'matrix',
        id: 'work',
        rowHeader: 'Question',
        columns: P12,
        rows: [
          { id: 'status', label: 'Work status', type: 'radio', options: ['Employed', 'Self-employed', 'Not working', 'Retired'] },
          { id: 'employer', label: 'Employer or business name' },
          { id: 'employer_addr', label: 'Employer or business address and country', type: 'textarea' },
          { id: 'since', label: 'Working there since (month and year)', placeholder: 'e.g. March 2018' },
          { id: 'not_working', label: 'If not working: since when, and why', type: 'textarea' },
          { id: 'registered', label: 'Is the business registered?', type: 'radio', options: YN },
          { id: 'biz_type', label: 'Type of business', type: 'select', options: ['Sole owner', 'Partnership', 'Company', 'Other'] },
          { id: 'share', label: 'Share of the business you own (%)' },
          { id: 'employees', label: 'Number of employees', type: 'number' },
          { id: 'biz_value', label: 'Current value of the business' },
          { id: 'biz_debt', label: 'Money owed by the business' },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: 'income',
    number: '7',
    title: "Parents' income",
    intro:
      'Give the amount for the whole year, before tax. Where a figure is an estimate, write "estimate" beside it. Totals are added up for you.',
    blocks: [
      {
        kind: 'fields',
        fields: [
          {
            id: 'income_year',
            label: 'Most recent completed tax year',
            type: 'text',
            placeholder: 'e.g. 2025',
          },
        ],
      },
      {
        kind: 'matrix',
        id: 'income',
        rowHeader: 'Source of income',
        totalRow: true,
        columns: [...P12SUM, DOCCOL],
        rows: [
          { id: 'salary', label: 'Salary, wages, tips, and bonuses' },
          { id: 'business', label: 'Business or self-employment income (after business costs)' },
          { id: 'farm', label: 'Farm income (after costs)' },
          { id: 'rental', label: 'Rental or property income (after costs)' },
          { id: 'interest', label: 'Interest and dividends' },
          { id: 'profits', label: 'Profits from sale of assets or investments' },
          { id: 'pension', label: 'Pension, annuity, or retirement income' },
          { id: 'unemployment', label: 'Unemployment benefit or severance pay' },
          { id: 'govt', label: 'Government benefits or social security' },
          { id: 'maintenance', label: 'Maintenance or child support received' },
          { id: 'relatives', label: 'Regular money received from relatives or others', hint: 'Amount, then who it is from.' },
          { id: 'allowances', label: 'Allowances paid by employer (housing, car, food, school fees) not included above' },
          { id: 'retirement_contrib', label: 'Employer or personal contributions to a pension or retirement plan' },
          { id: 'other', label: 'Any other income', hint: 'Amount, then please explain.' },
        ],
      },
      {
        kind: 'matrix',
        id: 'history',
        title: 'Income history and expected income',
        note: 'Give the total income (all sources) for each year. If income has changed, say what happened.',
        rowHeader: 'Period',
        columns: [
          { id: 'year', label: 'Year', placeholder: 'e.g. 2024' },
          { id: 'p1', label: 'Parent 1 total' },
          { id: 'p2', label: 'Parent 2 total' },
          DOCCOL,
          { id: 'changed', label: 'What changed?', type: 'textarea' },
        ],
        rows: [
          { id: 'two_ago', label: 'Two years ago' },
          { id: 'last', label: 'Last year' },
          { id: 'this', label: 'This year, expected' },
          { id: 'next', label: 'Next year, expected' },
        ],
      },
      {
        kind: 'fields',
        fields: [
          { id: 'lost_job', label: 'Has either parent lost a job, closed a business, or had a major fall in income? If so, give the date and reason.', type: 'textarea' },
          { id: 'income_ended', label: 'Date a contract, funding, or major source of income ended (if applicable)', type: 'text' },
          { id: 'income_change', label: 'Do you expect your income to change this year or next? If yes, please explain.', type: 'textarea' },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: 'tax',
    number: '8',
    title: 'Tax and mandatory deductions',
    intro: 'For the same year as in Section 7 (most recent completed tax year).',
    blocks: [
      {
        kind: 'matrix',
        id: 'taxfiled',
        rowHeader: 'Question',
        columns: P12,
        rows: [
          { id: 'filed', label: 'Was a tax return filed?', type: 'radio', options: YN },
          { id: 'country', label: 'In which country was it filed?' },
        ],
      },
      {
        kind: 'matrix',
        id: 'tax',
        rowHeader: 'Item',
        totalRow: true,
        columns: [...P12SUM, DOCCOL],
        rows: [
          { id: 'income_tax', label: 'Income tax paid' },
          { id: 'social', label: 'Social security, pension scheme, health insurance, or housing levy deducted by law' },
          { id: 'other', label: 'Other taxes or levies', hint: 'Amount, then please list.' },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: 'assets',
    number: '9',
    title: 'What the parents own (assets)',
    intro: 'Use market value (what it could be sold for today), not what was paid for it.',
    blocks: [
      { kind: 'fields', fields: [{ id: 'assets_date', label: 'Give values as of this date', type: 'date' }] },
      {
        kind: 'matrix',
        id: 'assets',
        rowHeader: 'Asset',
        totalRow: true,
        columns: [
          { id: 'value', label: 'Current value', sum: true },
          { id: 'owed', label: 'Amount still owed on it', sum: true },
          DOCCOL,
        ],
        rows: [
          { id: 'cash', label: 'Cash, savings, and checking accounts (all accounts, all banks)' },
          { id: 'fixed', label: 'Fixed deposits, certificates of deposit, money market accounts' },
          { id: 'stocks', label: 'Stocks, bonds, mutual funds, SACCO or cooperative shares, other investments' },
          { id: 'trusts', label: 'Trust funds', hint: 'Name the beneficiary.' },
          { id: 'edu_savings', label: 'Education savings or tuition plans set aside for any child' },
          { id: 'retirement', label: 'Pension and retirement account balances' },
          { id: 'life_ins', label: 'Cash value of life insurance policies' },
          { id: 'biz_assets', label: 'Business assets (current value of your share)' },
          { id: 'farm', label: 'Farm assets' },
          { id: 'other', label: 'Other things of value (gold, art, livestock, etc.)' },
        ],
      },
      {
        kind: 'matrix',
        id: 'property',
        title: 'Home and other property',
        rowHeader: 'Item',
        columns: [
          { id: 'value', label: 'Current market value' },
          { id: 'owed', label: 'Amount still owed' },
          DOCCOL,
        ],
        rows: [
          { id: 'home', label: 'Main home', hint: 'Value and mortgage balance.' },
          { id: 'bought', label: 'Year bought, and purchase price' },
          { id: 'rent', label: 'Monthly mortgage or rent payment' },
          { id: 'land1', label: 'Other land or property (1): what is it, and where?' },
          { id: 'land2', label: 'Other land or property (2): what is it, and where?' },
          { id: 'vehicles', label: 'Vehicles: what, and its value' },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: 'debts',
    number: '10',
    title: 'Loans and other debts',
    intro:
      'Include the mortgage, car loans, bank and SACCO loans, credit cards, and money owed to individuals. Do not repeat debts already listed against an asset in Section 9 unless you want to explain them here.',
    blocks: [
      {
        kind: 'table',
        id: 'debts',
        entryLabel: 'Debt',
        initialRows: 2,
        maxRows: 15,
        columns: [
          { id: 'lender', label: 'Lender or person owed' },
          { id: 'purpose', label: 'What it is for' },
          { id: 'original', label: 'Original amount' },
          { id: 'balance', label: 'Balance now' },
          { id: 'monthly', label: 'Monthly payment' },
          { id: 'end', label: 'End date', type: 'date' },
          { id: 'statement', label: 'Statement', type: 'select', options: DOC },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: 'costs',
    number: '11',
    title: 'Yearly living and other costs',
    intro:
      "Give the total for the whole year. If you only know the monthly amount, say so in the last column. Costs for the student's siblings' education go in Section 5.",
    blocks: [
      {
        kind: 'matrix',
        id: 'costs',
        rowHeader: 'Cost',
        totalRow: true,
        columns: [
          { id: 'actual', label: 'Actual, last year', sum: true },
          { id: 'expected', label: 'Expected, this year', sum: true },
          { id: 'basis', label: 'Document, or how you worked it out' },
        ],
        rows: [
          { id: 'rent', label: 'Rent or mortgage payments' },
          { id: 'food', label: 'Food' },
          { id: 'utilities', label: 'Utilities (water, electricity, internet, phone)' },
          { id: 'transport', label: 'Transport (fuel, public transport, vehicle costs)' },
          { id: 'clothing', label: 'Clothing' },
          { id: 'household', label: 'Household items and repairs' },
          { id: 'medical', label: 'Medical and dental costs not paid by insurance' },
          { id: 'insurance', label: 'Insurance premiums (health, life, vehicle, home)' },
          { id: 'childcare', label: 'Child care' },
          { id: 'elder', label: 'Care or support for elderly parents or relatives', hint: 'Amount, then who.' },
          { id: 'legal', label: 'Legal costs or maintenance paid to a former partner' },
          { id: 'unusual', label: 'Any other unusual or one-time cost', hint: 'Amount, then please explain.' },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: 'coverage',
    number: '12',
    title: 'How extra costs were covered',
    intro:
      'If your costs are higher than your income, colleges will ask how the difference was paid. Please be open about this. It helps the college understand your real situation.',
    blocks: [
      {
        kind: 'matrix',
        id: 'coverage',
        rowHeader: 'Source',
        totalRow: true,
        columns: [
          { id: 'last', label: 'Last year', sum: true },
          { id: 'sofar', label: 'This year so far', sum: true },
          DOCCOL,
        ],
        rows: [
          { id: 'loans', label: 'New loans taken' },
          { id: 'savings', label: 'Savings used' },
          { id: 'relatives', label: 'Help from relatives or friends', hint: 'Amount, then who.' },
          { id: 'sponsor', label: 'Help from a sponsor, church, or organisation', hint: 'Amount, then who.' },
          { id: 'asset_sale', label: 'Sale of an asset', hint: 'Amount, then what.' },
          { id: 'unpaid', label: 'Bills or fees left unpaid' },
          { id: 'else', label: 'Anything else', hint: 'Amount, then please explain.' },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: 'student_fin',
    number: '13',
    title: "The student's own finances",
    blocks: [
      {
        kind: 'matrix',
        id: 'sfin',
        rowHeader: 'Item',
        columns: [{ id: 'amount', label: 'Amount' }, DOCCOL],
        rows: [
          { id: 'cash', label: "Student's cash, savings, and bank balances" },
          { id: 'invest', label: "Student's investments or trust funds" },
          { id: 'income_last', label: "Student's income from work last year" },
          { id: 'income_this', label: "Student's expected income from work this year" },
          { id: 'awards', label: 'Scholarships, awards, or sponsorship the student already has', hint: 'From school, government, or others. Name the source.' },
          { id: 'contribute', label: 'Amount the student expects to contribute from savings or summer work' },
          { id: 'other_money', label: "Other money available for the student's education", hint: 'Relatives, sponsor, employer, government.' },
        ],
      },
      {
        kind: 'fields',
        fields: [
          { id: 'travel_payer', label: "Who will pay for the student's travel to the college and other costs outside the college bill?", type: 'textarea' },
          { id: 'family_contribution', label: 'How much can the family contribute each year toward college costs?', type: 'text' },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: 'special',
    number: '14',
    title: 'Special circumstances',
    intro:
      "Tick anything that has affected your family's finances, and then explain. This is where colleges learn about situations that the numbers alone do not show.",
    blocks: [
      {
        kind: 'fields',
        fields: [
          {
            id: 'special_list',
            label: 'What has affected your family?',
            type: 'checkboxes',
            options: [
              'Job loss or end of a contract',
              'Business closed, failed, or lost funding',
              'Major fall in income',
              'Death of a parent or family member',
              'Serious illness or disability in the family',
              'High medical or dental costs',
              'Divorce, separation, or change in family structure',
              "Supporting relatives or extra dependents (for example, taking in a relative's children)",
              'Currency devaluation or inflation that has affected your savings or costs',
              'Natural disaster, fire, or theft',
              'Other (please explain below)',
            ],
          },
          {
            id: 'special_explain',
            label: 'Explain',
            type: 'textarea',
            hint: 'Write what happened, when it happened, and how it affects your ability to pay.',
          },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: 'other_info',
    number: '15',
    title: 'Anything else the college should know',
    blocks: [{ kind: 'fields', fields: [{ id: 'other_info', label: 'Additional information (optional)', type: 'textarea' }] }],
  },

  /* ------------------------------------------------------------------ */
  {
    id: 'documents',
    number: '16',
    title: 'Documents checklist',
    intro:
      "Tick each document you have ready. You do not upload them here. Colleges usually ask for uploads through the College Board's IDOC service, so keep scans clear and complete. Documents not in English need an English translation.",
    blocks: [
      {
        kind: 'fields',
        fields: [
          {
            id: 'docs_ready',
            label: 'Documents I have ready',
            type: 'checkboxes',
            options: [
              'Tax returns for both parents for the last two years, with filing receipts (signed, with English translation if needed)',
              "If no tax return is filed: official income statements, payslips, or an employer's letter showing yearly pay",
              'Business profit and loss statement and business bank statements, last two years and this year so far',
              'Proof that a job, contract, or funding ended (termination letter, contract end notice)',
              'Bank statements for every account, last 12 months',
              'Investment, brokerage, SACCO, and pension statements',
              'Mortgage and loan statements',
              'Home valuation or recent comparable sales; valuations for any other property',
              'School and college fee statements and scholarship letters for each child',
              'Proof of money sent to parents, relatives, or others you support',
              'Medical bills and insurance statements for the last year',
              'Divorce decree, separation agreement, or custody papers (if relevant)',
              'Guardianship or dependency papers, and a death certificate (if relevant)',
              "Copies of the student's and parents' passports or national IDs",
              "Each college's own forms (for example, an international student certification of finances), signed",
            ],
          },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: 'declaration',
    number: '17',
    title: 'Declaration',
    intro: 'Please read the statement below, tick the box, and type your full name as your signature.',
    blocks: [
      {
        kind: 'fields',
        fields: [
          {
            id: 'declaration_agree',
            type: 'consent',
            required: true,
            label:
              'I confirm that the information in this form is true and complete to the best of my knowledge. I understand that colleges may ask for documents to check it, and that giving false information can lead to loss of aid or an offer of admission.',
          },
        ],
      },
      {
        kind: 'fields',
        title: 'Signatures',
        note: 'At least one person must sign. Typing your full name counts as your signature.',
        fields: [
          { id: 'sig_p1_name', label: 'Parent 1: full name', type: 'text' },
          { id: 'sig_p1_date', label: 'Parent 1: date', type: 'date' },
          { id: 'sig_p2_name', label: 'Parent 2: full name', type: 'text' },
          { id: 'sig_p2_date', label: 'Parent 2: date', type: 'date' },
          { id: 'sig_st_name', label: 'Student: full name', type: 'text' },
          { id: 'sig_st_date', label: 'Student: date', type: 'date' },
        ],
      },
    ],
    custom: (a) => {
      const out: { key: string; label: string; message: string }[] = [];
      const who: [string, string, string][] = [
        ['sig_p1_name', 'sig_p1_date', 'Parent 1'],
        ['sig_p2_name', 'sig_p2_date', 'Parent 2'],
        ['sig_st_name', 'sig_st_date', 'Student'],
      ];
      const signed = who.filter(([n]) => String(a[n] ?? '').trim());
      if (signed.length === 0) {
        out.push({ key: 'sig_p1_name', label: 'Signature', message: 'At least one person must type their full name to sign.' });
      }
      for (const [n, d, label] of signed) {
        if (!String(a[d] ?? '').trim()) out.push({ key: d, label: `${label}: date`, message: 'Please add the date of signing.' });
      }
      return out;
    },
  },
];

export function visibleSections(a: Answers): Section[] {
  return SECTIONS.filter((s) => !s.showIf || s.showIf(a));
}

export const sectionLabel = (s: Section) => (s.number ? `${s.number}. ${s.title}` : s.title);

export function cellType(row: MatrixRow, col: Column): FieldType {
  return row.type ?? col.type ?? 'text';
}
export function cellOptions(row: MatrixRow, col: Column): string[] | undefined {
  return row.options ?? col.options;
}
