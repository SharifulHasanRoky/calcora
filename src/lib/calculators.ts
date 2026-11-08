/**
 * CALCORA Calculator Directory
 * Central registry of all calculators with metadata.
 * Used by the search, directory page, and navigation.
 */

export type CalcCategory =
  | "math"
  | "finance"
  | "tax"
  | "health"
  | "business"
  | "marketing"
  | "datetime"
  | "converter"
  | "engineering"
  | "everyday"
  | "text"
  | "numbersystem"
  | "devtools"
  | "utility";

export interface CalcMeta {
  id: string;
  name: string;
  category: CalcCategory;
  description: string;
  keywords: string[];
  /** Optional country code for tax calculators. */
  country?: string;
  /** Marks calculators as ready (most are; some listed for directory completeness). */
  ready?: boolean;
}

export const CATEGORY_META: Record<CalcCategory, { name: string; icon: string; color: string; description: string }> = {
  math: { name: "Mathematics", icon: "Sigma", color: "#635BFF", description: "Basic, scientific, algebra, statistics, calculus." },
  finance: { name: "Finance", icon: "Landmark", color: "#16A34A", description: "Loans, interest, investments, retirement, ROI." },
  tax: { name: "Tax", icon: "ReceiptText", color: "#DC2626", description: "Country-specific income tax, VAT, GST, capital gains." },
  health: { name: "Health & Fitness", icon: "HeartPulse", color: "#EF4444", description: "BMI, BMR, TDEE, calories, body fat, macros." },
  business: { name: "Business", icon: "Briefcase", color: "#0EA5E9", description: "Profit, margin, break-even, valuation, inventory." },
  marketing: { name: "Marketing", icon: "Megaphone", color: "#F59E0B", description: "CPM, CPC, CTR, CPA, ROAS, conversion rate." },
  datetime: { name: "Date & Time", icon: "CalendarDays", color: "#8B5CF6", description: "Age, days between, time zones, working days, timer, stopwatch." },
  converter: { name: "Converters", icon: "ArrowLeftRight", color: "#06B6D4", description: "Length, weight, temperature, area, volume, data, currency." },
  engineering: { name: "Engineering", icon: "Wrench", color: "#0F766E", description: "Concrete, paint, Ohm's law, electricity, force." },
  everyday: { name: "Everyday Tools", icon: "Coffee", color: "#D97706", description: "Tip, split bill, fuel cost, subscription, savings goal." },
  text: { name: "Text Tools", icon: "Type", color: "#EC4899", description: "Word counter, character counter, lorem ipsum, number to words." },
  numbersystem: { name: "Number System", icon: "Binary", color: "#7C3AED", description: "Roman numerals, binary/hex/octal/decimal, text to binary." },
  devtools: { name: "Developer Tools", icon: "Code2", color: "#0891B2", description: "CSS clamp, aspect ratio, subnet/CIDR, timestamp." },
  utility: { name: "Random & Utility", icon: "Dices", color: "#059669", description: "Random number, dice roller, coin flip, tally counter." },
};

export const CALCULATORS: CalcMeta[] = [
  // ===== MATH (basic) =====
  { id: "universal", name: "Universal Calculator", category: "math", description: "All-in-one calculator: basic, scientific, programmer, fraction, statistics, graphing.", keywords: ["standard","scientific","programmer","graphing","universal","workspace"], ready: true },
  { id: "percentage", name: "Percentage Calculator", category: "math", description: "Find a percentage of a number, percent change, and more.", keywords: ["percent","%","portion"], ready: true },
  { id: "percentage-increase", name: "Percentage Increase", category: "math", description: "Calculate the percentage increase between two values.", keywords: ["percent","increase","growth","change"], ready: true },
  { id: "percentage-decrease", name: "Percentage Decrease", category: "math", description: "Calculate the percentage decrease between two values.", keywords: ["percent","decrease","decline","reduction"], ready: true },
  { id: "percentage-difference", name: "Percentage Difference", category: "math", description: "Percentage difference between two values of equal significance.", keywords: ["percent","difference","compare"], ready: true },
  { id: "ratio", name: "Ratio Calculator", category: "math", description: "Simplify ratios and solve ratio proportions.", keywords: ["ratio","proportion","simplify"], ready: true },
  { id: "average", name: "Average Calculator", category: "math", description: "Mean of a list of numbers with sum and count.", keywords: ["mean","average","arithmetic"], ready: true },
  { id: "fraction", name: "Fraction Calculator", category: "math", description: "Add, subtract, multiply, divide and simplify fractions.", keywords: ["fraction","numerator","denominator","simplify"], ready: true },
  { id: "rounding", name: "Rounding Calculator", category: "math", description: "Round numbers to a given decimal place.", keywords: ["round","decimal","places"], ready: true },
  { id: "sqrt", name: "Square Root Calculator", category: "math", description: "Square root and n-th root of a number.", keywords: ["square root","radical","nth root"], ready: true },
  { id: "exponent", name: "Exponent Calculator", category: "math", description: "Raise a base to a power.", keywords: ["power","exponent","base"], ready: true },
  { id: "scientific-notation", name: "Scientific Notation", category: "math", description: "Convert between standard and scientific notation.", keywords: ["scientific","notation","exponential"], ready: true },
  { id: "gcd-lcm", name: "GCD & LCM Calculator", category: "math", description: "Greatest common divisor and least common multiple.", keywords: ["gcd","lcm","hcf","factor","multiple"], ready: true },
  { id: "prime", name: "Prime Number Calculator", category: "math", description: "Check primality and find prime factors.", keywords: ["prime","factor","divisor"], ready: true },
  // ===== MATH (scientific) =====
  { id: "scientific", name: "Scientific Calculator", category: "math", description: "Trig, logs, exponents, constants, parentheses.", keywords: ["scientific","trig","log","sin","cos","tan"], ready: true },
  { id: "quadratic", name: "Quadratic Formula", category: "math", description: "Solve ax² + bx + c = 0 with full working.", keywords: ["quadratic","equation","roots","discriminant"], ready: true },
  { id: "logarithm", name: "Logarithm Calculator", category: "math", description: "Compute log base 10, base e, base n.", keywords: ["log","ln","logarithm"], ready: true },
  { id: "trigonometry", name: "Trigonometry Calculator", category: "math", description: "Sine, cosine, tangent and their inverses.", keywords: ["trig","sin","cos","tan","angle"], ready: true },
  { id: "factorial", name: "Factorial Calculator", category: "math", description: "n! for non-negative integers.", keywords: ["factorial","n!","gamma"], ready: true },
  { id: "permutation-combination", name: "Permutation & Combination", category: "math", description: "nPr and nCr.", keywords: ["permutation","combination","npr","ncr"], ready: true },
  { id: "statistics", name: "Statistics Calculator", category: "math", description: "Mean, median, mode, range, quartiles.", keywords: ["statistics","mean","median","mode","range","quartile"], ready: true },
  { id: "std-dev-variance", name: "Standard Deviation & Variance", category: "math", description: "Population and sample standard deviation and variance.", keywords: ["standard deviation","variance","sigma","spread"], ready: true },
  { id: "graphing", name: "Graphing Calculator", category: "math", description: "Plot functions of x with an interactive graph.", keywords: ["graph","plot","function","curve"], ready: true },
  { id: "multi-calc", name: "Multi-Calculation Workspace", category: "math", description: "Run multiple calculations side by side and compare.", keywords: ["multi","compare","rows","workspace"], ready: true },

  // ===== FINANCE =====
  { id: "loan", name: "Loan Calculator", category: "finance", description: "Monthly payment, total interest, amortization.", keywords: ["loan","payment","amortization","installment"], ready: true },
  { id: "mortgage", name: "Mortgage Calculator", category: "finance", description: "Home loan payment with taxes and insurance.", keywords: ["mortgage","home","house","property"], ready: true },
  { id: "emi", name: "EMI Calculator", category: "finance", description: "Equated Monthly Installment for a loan.", keywords: ["emi","installment","loan","monthly"], ready: true },
  { id: "compound-interest", name: "Compound Interest", category: "finance", description: "Interest on principal + accumulated interest.", keywords: ["compound","interest","growth","investment"], ready: true },
  { id: "simple-interest", name: "Simple Interest", category: "finance", description: "Interest = P × R × T.", keywords: ["simple","interest","principal","rate"], ready: true },
  { id: "savings", name: "Savings Calculator", category: "finance", description: "Project savings growth with regular deposits.", keywords: ["savings","goal","deposit","future"], ready: true },
  { id: "investment", name: "Investment Calculator", category: "finance", description: "Future value of an investment over time.", keywords: ["investment","future value","return"], ready: true },
  { id: "roi", name: "ROI Calculator", category: "finance", description: "Return on investment as a percentage.", keywords: ["roi","return","investment","profit"], ready: true },
  { id: "cagr", name: "CAGR Calculator", category: "finance", description: "Compound Annual Growth Rate.", keywords: ["cagr","annual","growth","rate"], ready: true },
  { id: "profit-margin", name: "Profit Margin", category: "finance", description: "Gross, operating, and net profit margin.", keywords: ["profit","margin","gross","net"], ready: true },
  { id: "markup", name: "Markup Calculator", category: "finance", description: "Markup percentage from cost to selling price.", keywords: ["markup","cost","price","margin"], ready: true },
  { id: "discount", name: "Discount Calculator", category: "finance", description: "Sale price after a percentage discount.", keywords: ["discount","sale","off","markdown"], ready: true },
  { id: "future-value", name: "Future Value", category: "finance", description: "Future value of a present sum with interest.", keywords: ["future value","fv","compound"], ready: true },
  { id: "present-value", name: "Present Value", category: "finance", description: "Present value of a future sum.", keywords: ["present value","pv","discount"], ready: true },
  { id: "break-even", name: "Break-Even Calculator", category: "finance", description: "Units to sell to cover fixed costs.", keywords: ["break even","fixed","variable","units"], ready: true },
  { id: "salary", name: "Salary Calculator", category: "finance", description: "Convert between hourly, daily, monthly, annual.", keywords: ["salary","hourly","annual","income"], ready: true },
  { id: "retirement", name: "Retirement Calculator", category: "finance", description: "Project retirement corpus needed.", keywords: ["retirement","pension","corpus","nest egg"], ready: true },
  { id: "net-worth", name: "Net Worth Calculator", category: "finance", description: "Assets minus liabilities.", keywords: ["net worth","assets","liabilities"], ready: true },

  // ===== TAX (country-specific) =====
  { id: "tax-us", name: "US Income Tax Calculator", category: "tax", country: "US", description: "Federal income tax with 2024 brackets.", keywords: ["tax","us","usa","federal","income"], ready: true },
  { id: "tax-uk", name: "UK Income Tax Calculator", category: "tax", country: "UK", description: "Income tax + National Insurance (2024/25).", keywords: ["tax","uk","national insurance","paye"], ready: true },
  { id: "tax-ca", name: "Canada Income Tax Calculator", category: "tax", country: "CA", description: "Federal + provincial tax (Ontario 2024).", keywords: ["tax","canada","provincial","federal"], ready: true },
  { id: "tax-au", name: "Australia Income Tax Calculator", category: "tax", country: "AU", description: "Income tax + Medicare levy (2024/25).", keywords: ["tax","australia","medicare","ato"], ready: true },
  { id: "tax-bd", name: "Bangladesh Income Tax Calculator", category: "tax", country: "BD", description: "Personal income tax (FY 2024-25).", keywords: ["tax","bangladesh","nbr","salary"], ready: true },
  { id: "tax-in", name: "India Income Tax Calculator", category: "tax", country: "IN", description: "Old vs new regime comparison (FY 2024-25).", keywords: ["tax","india","regime","old","new"], ready: true },
  { id: "tax-my", name: "Malaysia Income Tax Calculator", category: "tax", country: "MY", description: "PCB/MTD + annual tax (YA 2024).", keywords: ["tax","malaysia","pcb","mtd"], ready: true },
  { id: "tax-ae", name: "UAE Tax Calculator", category: "tax", country: "AE", description: "VAT + corporate tax (2024).", keywords: ["tax","uae","dubai","vat","corporate"], ready: true },
  { id: "tax-sg", name: "Singapore Income Tax Calculator", category: "tax", country: "SG", description: "Personal income tax (YA 2024).", keywords: ["tax","singapore","iras","cpf"], ready: true },
  { id: "tax-de", name: "Germany Income Tax Calculator", category: "tax", country: "DE", description: "Income tax + solidarity + church (2024).", keywords: ["tax","germany","lohnsteuer","solz"], ready: true },
  { id: "vat", name: "VAT Calculator", category: "tax", description: "Add or remove VAT from a price.", keywords: ["vat","tax","sales","add","remove"], ready: true },
  { id: "gst", name: "GST Calculator", category: "tax", description: "Goods and Services Tax calculator.", keywords: ["gst","tax","india","australia"], ready: true },
  { id: "sales-tax", name: "Sales Tax Calculator", category: "tax", description: "Add US-style sales tax to a price.", keywords: ["sales","tax","us","state"], ready: true },
  { id: "capital-gains", name: "Capital Gains Tax", category: "tax", description: "Estimate capital gains tax (US long-term).", keywords: ["capital gains","investment","stock"], ready: true },

  // ===== HEALTH =====
  { id: "bmi", name: "BMI Calculator", category: "health", description: "Body Mass Index with category & healthy range.", keywords: ["bmi","body mass","weight","height","obesity"], ready: true },
  { id: "bmr", name: "BMR Calculator", category: "health", description: "Basal Metabolic Rate (Mifflin-St Jeor).", keywords: ["bmr","metabolism","calories","resting"], ready: true },
  { id: "tdee", name: "TDEE Calculator", category: "health", description: "Total Daily Energy Expenditure.", keywords: ["tdee","calories","activity","maintenance"], ready: true },
  { id: "calorie", name: "Daily Calorie Calculator", category: "health", description: "Calorie target for lose/maintain/gain.", keywords: ["calorie","diet","weight loss","deficit"], ready: true },
  { id: "ideal-weight", name: "Ideal Weight Calculator", category: "health", description: "Ideal body weight (Devine formula).", keywords: ["ideal","weight","devine","healthy"], ready: true },
  { id: "body-fat", name: "Body Fat Calculator", category: "health", description: "US Navy method body fat percentage.", keywords: ["body fat","navy","percentage","adipose"], ready: true },
  { id: "macro", name: "Macro Calculator", category: "health", description: "Protein, carb, fat split for a calorie target.", keywords: ["macro","protein","carb","fat","split"], ready: true },
  { id: "water", name: "Water Intake Calculator", category: "health", description: "Daily water intake recommendation.", keywords: ["water","hydration","intake","drinking"], ready: true },
  { id: "pace", name: "Running Pace Calculator", category: "health", description: "Pace from distance and time.", keywords: ["pace","running","min per km","min per mile"], ready: true },
  { id: "heart-rate", name: "Heart Rate Zone", category: "health", description: "Target heart rate training zones.", keywords: ["heart rate","zone","training","cardio"], ready: true },
  { id: "waist-hip", name: "Waist-to-Hip Ratio", category: "health", description: "WHR health risk indicator.", keywords: ["waist","hip","ratio","whr"], ready: true },

  // ===== DATETIME =====
  { id: "age", name: "Age Calculator", category: "datetime", description: "Age in years, months, days.", keywords: ["age","birthday","years","days"], ready: true },
  { id: "days-between", name: "Days Between Dates", category: "datetime", description: "Number of days between two dates.", keywords: ["days","between","difference","dates"], ready: true },
  { id: "date-add-subtract", name: "Date Add/Subtract", category: "datetime", description: "Add or subtract days, weeks, months.", keywords: ["date","add","subtract","future","past"], ready: true },
  { id: "time-duration", name: "Time Duration", category: "datetime", description: "Duration between two times.", keywords: ["time","duration","hours","minutes"], ready: true },
  { id: "working-days", name: "Working Days Calculator", category: "datetime", description: "Business days between two dates.", keywords: ["working","business","days","weekdays"], ready: true },
  { id: "countdown", name: "Countdown Calculator", category: "datetime", description: "Time until a future date.", keywords: ["countdown","until","future","event"], ready: true },

  // ===== CONVERTERS =====
  { id: "conv-length", name: "Length Converter", category: "converter", description: "Meters, feet, miles, km, inches.", keywords: ["length","distance","meter","foot","mile"], ready: true },
  { id: "conv-weight", name: "Weight Converter", category: "converter", description: "Kg, lb, g, oz, ton.", keywords: ["weight","mass","kg","lb","gram"], ready: true },
  { id: "conv-temperature", name: "Temperature Converter", category: "converter", description: "Celsius, Fahrenheit, Kelvin.", keywords: ["temperature","celsius","fahrenheit","kelvin"], ready: true },
  { id: "conv-area", name: "Area Converter", category: "converter", description: "m², ft², acre, hectare.", keywords: ["area","square","acre","hectare"], ready: true },
  { id: "conv-volume", name: "Volume Converter", category: "converter", description: "L, mL, gal, cup, fl oz.", keywords: ["volume","liter","gallon","cup"], ready: true },
  { id: "conv-speed", name: "Speed Converter", category: "converter", description: "km/h, mph, m/s, knot.", keywords: ["speed","kmh","mph","knot","velocity"], ready: true },
  { id: "conv-time", name: "Time Converter", category: "converter", description: "Seconds, minutes, hours, days.", keywords: ["time","seconds","minutes","hours"], ready: true },
  { id: "conv-data", name: "Data Storage Converter", category: "converter", description: "Bytes, KB, MB, GB, TB.", keywords: ["data","byte","kb","mb","gb","tb"], ready: true },
  { id: "conv-energy", name: "Energy Converter", category: "converter", description: "Joule, calorie, kWh, BTU.", keywords: ["energy","joule","calorie","kwh","btu"], ready: true },
  { id: "conv-pressure", name: "Pressure Converter", category: "converter", description: "Pa, bar, psi, atm.", keywords: ["pressure","pascal","bar","psi","atm"], ready: true },
  { id: "conv-power", name: "Power Converter", category: "converter", description: "Watt, kW, hp, BTU/h.", keywords: ["power","watt","horsepower","kw"], ready: true },
  { id: "conv-fuel", name: "Fuel Economy Converter", category: "converter", description: "km/L, L/100km, mpg.", keywords: ["fuel","mpg","km per liter","consumption"], ready: true },
  { id: "conv-angle", name: "Angle Converter", category: "converter", description: "Degree, radian, gradian.", keywords: ["angle","degree","radian","gradian"], ready: true },
  { id: "conv-cooking", name: "Cooking Converter", category: "converter", description: "Cups, tablespoons, teaspoons, ml.", keywords: ["cooking","cup","tablespoon","teaspoon","ml"], ready: true },
  { id: "conv-universal", name: "Universal Unit Converter", category: "converter", description: "All categories in one workspace.", keywords: ["unit","convert","all","universal"], ready: true },

  // ===== BUSINESS & MARKETING =====
  { id: "profit", name: "Profit Calculator", category: "business", description: "Gross and net profit from revenue and cost.", keywords: ["profit","revenue","cost","gross","net"], ready: true },
  { id: "business-valuation", name: "Business Valuation", category: "business", description: "Valuation via earnings multiple.", keywords: ["valuation","business","multiple","ebitda"], ready: true },
  { id: "inventory-turnover", name: "Inventory Turnover", category: "business", description: "How often inventory is sold and replaced.", keywords: ["inventory","turnover","stock","ratio"], ready: true },
  { id: "shipping", name: "Shipping Cost Calculator", category: "business", description: "Per-item shipping cost from total.", keywords: ["shipping","cost","logistics","freight"], ready: true },
  { id: "cpm", name: "CPM Calculator", category: "marketing", description: "Cost per thousand impressions.", keywords: ["cpm","cost per mille","impressions","advertising"], ready: true },
  { id: "cpc", name: "CPC Calculator", category: "marketing", description: "Cost per click.", keywords: ["cpc","cost per click","ppc","ad"], ready: true },
  { id: "ctr", name: "CTR Calculator", category: "marketing", description: "Click-through rate.", keywords: ["ctr","click","through","rate"], ready: true },
  { id: "cpa", name: "CPA Calculator", category: "marketing", description: "Cost per acquisition / action.", keywords: ["cpa","acquisition","cost","conversion"], ready: true },
  { id: "roas", name: "ROAS Calculator", category: "marketing", description: "Return on ad spend.", keywords: ["roas","return","ad","spend"], ready: true },
  { id: "conversion-rate", name: "Conversion Rate", category: "marketing", description: "Conversions divided by visitors.", keywords: ["conversion","rate","visitors","leads"], ready: true },
  { id: "cac", name: "Customer Acquisition Cost", category: "marketing", description: "CAC = sales+marketing / new customers.", keywords: ["cac","customer","acquisition","cost"], ready: true },
  { id: "ltv", name: "Customer Lifetime Value", category: "marketing", description: "LTV = ARPU × gross margin × lifespan.", keywords: ["ltv","lifetime","value","clv"], ready: true },

  // ===== ENGINEERING =====
  { id: "concrete", name: "Concrete Calculator", category: "engineering", description: "Volume of concrete for a slab.", keywords: ["concrete","cement","slab","volume"], ready: true },
  { id: "paint", name: "Paint Calculator", category: "engineering", description: "Paint needed for a room.", keywords: ["paint","coverage","wall","room"], ready: true },
  { id: "flooring", name: "Flooring Calculator", category: "engineering", description: "Flooring material needed.", keywords: ["flooring","tile","wood","area"], ready: true },
  { id: "ohms-law", name: "Ohm's Law Calculator", category: "engineering", description: "V = IR, P = VI.", keywords: ["ohm","voltage","current","resistance","power"], ready: true },
  { id: "electricity-bill", name: "Electricity Bill Calculator", category: "engineering", description: "Estimate electricity cost.", keywords: ["electricity","bill","kwh","energy","cost"], ready: true },
  { id: "fuel-cost", name: "Fuel Cost Calculator", category: "engineering", description: "Fuel cost for a trip.", keywords: ["fuel","cost","trip","gas","petrol"], ready: true },

  // ===== EVERYDAY =====
  { id: "tip", name: "Tip Calculator", category: "everyday", description: "Tip and total bill split.", keywords: ["tip","gratuity","restaurant"], ready: true },
  { id: "split-bill", name: "Split Bill Calculator", category: "everyday", description: "Split a bill among people.", keywords: ["split","bill","share","group"], ready: true },
  { id: "unit-price", name: "Unit Price Calculator", category: "everyday", description: "Compare price per unit.", keywords: ["unit","price","compare","value"], ready: true },
  { id: "savings-goal", name: "Savings Goal Calculator", category: "everyday", description: "How much to save monthly to reach a goal.", keywords: ["savings","goal","monthly","target"], ready: true },
  { id: "subscription", name: "Subscription Cost", category: "everyday", description: "Total cost of subscriptions over time.", keywords: ["subscription","recurring","monthly","annual"], ready: true },

  // ===== FINANCE ADDITIONS =====
  { id: "sip", name: "SIP Calculator", category: "finance", description: "Systematic Investment Plan returns with monthly contributions.", keywords: ["sip","mutual fund","monthly","investment","india"], ready: true },
  { id: "fd", name: "FD Calculator", category: "finance", description: "Fixed Deposit maturity and interest.", keywords: ["fd","fixed deposit","maturity","bank"], ready: true },
  { id: "percentage-change", name: "Percentage Change Calculator", category: "math", description: "Percentage increase or decrease between two values.", keywords: ["percentage","change","increase","decrease","difference"], ready: true },
  { id: "watts-to-amps", name: "Watts to Amps Calculator", category: "engineering", description: "Convert watts to amps at a given voltage.", keywords: ["watts","amps","power","electrical","w to a"], ready: true },
  { id: "salary-hourly", name: "Salary to Hourly Calculator", category: "finance", description: "Convert annual salary to hourly, daily, weekly rate.", keywords: ["salary","hourly","annual","wage","convert"], ready: true },

  // ===== TEXT TOOLS =====
  { id: "word-counter", name: "Word Counter", category: "text", description: "Count words, sentences, paragraphs and reading time.", keywords: ["word","count","text","essay","writing"], ready: true },
  { id: "character-counter", name: "Character Counter", category: "text", description: "Count characters with and without spaces.", keywords: ["character","count","letter","text","length"], ready: true },
  { id: "lorem-ipsum", name: "Lorem Ipsum Generator", category: "text", description: "Generate placeholder text in paragraphs or words.", keywords: ["lorem","ipsum","placeholder","dummy","text"], ready: true },
  { id: "number-to-words", name: "Number to Words", category: "text", description: "Convert any number to English words.", keywords: ["number","words","text","spell","english"], ready: true },

  // ===== TIME UTILITIES =====
  { id: "online-timer", name: "Online Timer", category: "datetime", description: "Countdown timer with alarm.", keywords: ["timer","countdown","alarm","stopwatch"], ready: true },
  { id: "online-stopwatch", name: "Online Stopwatch", category: "datetime", description: "Precision stopwatch with lap times.", keywords: ["stopwatch","timer","lap","precision"], ready: true },
  { id: "world-clock", name: "World Clock", category: "datetime", description: "Current time across major world cities.", keywords: ["world","clock","time","city","global"], ready: true },
  { id: "timezone-converter", name: "Timezone Converter", category: "datetime", description: "Convert a time between time zones.", keywords: ["timezone","time","zone","convert","utc"], ready: true },
  { id: "unix-timestamp", name: "Unix Timestamp Converter", category: "datetime", description: "Convert between Unix timestamp and human date.", keywords: ["unix","timestamp","epoch","date","converter"], ready: true },
  { id: "birthday-countdown", name: "Birthday Countdown", category: "datetime", description: "Days until your next birthday.", keywords: ["birthday","countdown","days","until"], ready: true },
  { id: "days-until", name: "Days Until Date", category: "datetime", description: "Count days until a future date.", keywords: ["days","until","future","date","countdown"], ready: true },

  // ===== NUMBER SYSTEM =====
  { id: "roman-numerals", name: "Roman Numerals Converter", category: "numbersystem", description: "Convert between Roman numerals and numbers.", keywords: ["roman","numeral","x","v","i","convert"], ready: true },
  { id: "decimal-to-binary", name: "Decimal to Binary", category: "numbersystem", description: "Convert decimal numbers to binary.", keywords: ["decimal","binary","base","convert","10","2"], ready: true },
  { id: "binary-to-decimal", name: "Binary to Decimal", category: "numbersystem", description: "Convert binary numbers to decimal.", keywords: ["binary","decimal","base","convert","2","10"], ready: true },
  { id: "hex-to-decimal", name: "Hex to Decimal", category: "numbersystem", description: "Convert hexadecimal to decimal.", keywords: ["hex","hexadecimal","decimal","convert","16"], ready: true },
  { id: "hex-to-binary", name: "Hex to Binary", category: "numbersystem", description: "Convert hexadecimal to binary.", keywords: ["hex","binary","convert","16","2"], ready: true },
  { id: "binary-to-hex", name: "Binary to Hex", category: "numbersystem", description: "Convert binary to hexadecimal.", keywords: ["binary","hex","convert","2","16"], ready: true },
  { id: "octal-converter", name: "Octal Converter", category: "numbersystem", description: "Convert between octal, decimal, binary, hex.", keywords: ["octal","base","8","convert"], ready: true },
  { id: "text-to-binary", name: "Text to Binary", category: "numbersystem", description: "Convert text to binary ASCII representation.", keywords: ["text","binary","ascii","convert","encoding"], ready: true },
  { id: "binary-translator", name: "Binary Translator", category: "numbersystem", description: "Convert binary back to text.", keywords: ["binary","text","translator","ascii","decode"], ready: true },
  { id: "timestamp-to-date", name: "Timestamp to Date", category: "numbersystem", description: "Convert Unix timestamp to human-readable date.", keywords: ["timestamp","date","unix","epoch","convert"], ready: true },
  { id: "date-to-timestamp", name: "Date to Timestamp", category: "numbersystem", description: "Convert a date to Unix timestamp.", keywords: ["date","timestamp","unix","epoch","convert"], ready: true },

  // ===== DEVELOPER TOOLS =====
  { id: "css-clamp", name: "CSS Clamp Calculator", category: "devtools", description: "Generate CSS clamp() for fluid typography.", keywords: ["css","clamp","fluid","typography","responsive"], ready: true },
  { id: "aspect-ratio", name: "Aspect Ratio Calculator", category: "devtools", description: "Calculate dimensions from an aspect ratio.", keywords: ["aspect","ratio","dimensions","width","height","16:9"], ready: true },
  { id: "subnet-calculator", name: "Subnet Calculator", category: "devtools", description: "Calculate subnet details from IP and mask.", keywords: ["subnet","ip","network","cidr","mask"], ready: true },
  { id: "cidr-calculator", name: "CIDR Calculator", category: "devtools", description: "CIDR notation to IP range and details.", keywords: ["cidr","ip","range","network","subnet"], ready: true },

  // ===== RANDOM & UTILITY =====
  { id: "random-number", name: "Random Number Generator", category: "utility", description: "Generate random numbers in a range.", keywords: ["random","number","generate","rng"], ready: true },
  { id: "dice-roller", name: "Dice Roller", category: "utility", description: "Roll dice (d4, d6, d8, d10, d12, d20, d100).", keywords: ["dice","roll","dnd","d6","d20","random"], ready: true },
  { id: "coin-flip", name: "Coin Flip", category: "utility", description: "Flip a virtual coin — heads or tails.", keywords: ["coin","flip","heads","tails","random"], ready: true },
  { id: "tally-counter", name: "Tally Counter", category: "utility", description: "Count anything with a tap-to-increment counter.", keywords: ["tally","counter","count","click","increment"], ready: true },

  // ===== CURRENCY CONVERTER =====
  { id: "currency-converter", name: "Currency Converter", category: "converter", description: "Convert between USD, EUR, GBP, INR, JPY, AUD, CAD and more.", keywords: ["currency","exchange","rate","money","convert"], ready: true },
  { id: "usd-to-inr", name: "USD to INR", category: "converter", description: "Convert US Dollars to Indian Rupees.", keywords: ["usd","inr","dollar","rupee","currency"], ready: true },
  { id: "inr-to-usd", name: "INR to USD", category: "converter", description: "Convert Indian Rupees to US Dollars.", keywords: ["inr","usd","rupee","dollar","currency"], ready: true },
  { id: "eur-to-usd", name: "EUR to USD", category: "converter", description: "Convert Euros to US Dollars.", keywords: ["eur","usd","euro","dollar","currency"], ready: true },
  { id: "usd-to-eur", name: "USD to EUR", category: "converter", description: "Convert US Dollars to Euros.", keywords: ["usd","eur","dollar","euro","currency"], ready: true },
  { id: "usd-to-cad", name: "USD to CAD", category: "converter", description: "Convert US Dollars to Canadian Dollars.", keywords: ["usd","cad","dollar","canadian","currency"], ready: true },
  { id: "usd-to-gbp", name: "USD to GBP", category: "converter", description: "Convert US Dollars to British Pounds.", keywords: ["usd","gbp","dollar","pound","currency"], ready: true },
  { id: "gbp-to-eur", name: "GBP to EUR", category: "converter", description: "Convert British Pounds to Euros.", keywords: ["gbp","eur","pound","euro","currency"], ready: true },
  { id: "usd-to-jpy", name: "USD to JPY", category: "converter", description: "Convert US Dollars to Japanese Yen.", keywords: ["usd","jpy","dollar","yen","currency"], ready: true },
  { id: "aud-to-usd", name: "AUD to USD", category: "converter", description: "Convert Australian Dollars to US Dollars.", keywords: ["aud","usd","australian","dollar","currency"], ready: true },

  // ===== DEDICATED UNIT CONVERSION PAGES =====
  { id: "celsius-to-fahrenheit", name: "Celsius to Fahrenheit", category: "converter", description: "Convert °C to °F.", keywords: ["celsius","fahrenheit","temperature","convert"], ready: true },
  { id: "fahrenheit-to-celsius", name: "Fahrenheit to Celsius", category: "converter", description: "Convert °F to °C.", keywords: ["fahrenheit","celsius","temperature","convert"], ready: true },
  { id: "kg-to-lbs", name: "Kg to Lbs", category: "converter", description: "Convert kilograms to pounds.", keywords: ["kg","lbs","pounds","weight","convert"], ready: true },
  { id: "lbs-to-kg", name: "Lbs to Kg", category: "converter", description: "Convert pounds to kilograms.", keywords: ["lbs","kg","pounds","weight","convert"], ready: true },
  { id: "km-to-miles", name: "Km to Miles", category: "converter", description: "Convert kilometers to miles.", keywords: ["km","miles","distance","convert"], ready: true },
  { id: "miles-to-km", name: "Miles to Km", category: "converter", description: "Convert miles to kilometers.", keywords: ["miles","km","distance","convert"], ready: true },
  { id: "inches-to-cm", name: "Inches to Cm", category: "converter", description: "Convert inches to centimeters.", keywords: ["inches","cm","length","convert"], ready: true },
  { id: "cm-to-inches", name: "Cm to Inches", category: "converter", description: "Convert centimeters to inches.", keywords: ["cm","inches","length","convert"], ready: true },
  { id: "meters-to-feet", name: "Meters to Feet", category: "converter", description: "Convert meters to feet.", keywords: ["meters","feet","length","convert"], ready: true },
  { id: "feet-to-meters", name: "Feet to Meters", category: "converter", description: "Convert feet to meters.", keywords: ["feet","meters","length","convert"], ready: true },
  { id: "liters-to-gallons", name: "Liters to Gallons", category: "converter", description: "Convert liters to gallons.", keywords: ["liters","gallons","volume","convert"], ready: true },
  { id: "gallons-to-liters", name: "Gallons to Liters", category: "converter", description: "Convert gallons to liters.", keywords: ["gallons","liters","volume","convert"], ready: true },
  { id: "ounces-to-grams", name: "Ounces to Grams", category: "converter", description: "Convert ounces to grams.", keywords: ["ounces","grams","weight","convert","oz"], ready: true },
  { id: "grams-to-pounds", name: "Grams to Pounds", category: "converter", description: "Convert grams to pounds.", keywords: ["grams","pounds","weight","convert"], ready: true },
  { id: "mph-to-kmh", name: "Mph to Kmh", category: "converter", description: "Convert miles per hour to km per hour.", keywords: ["mph","kmh","speed","convert"], ready: true },
  { id: "kmh-to-mph", name: "Kmh to Mph", category: "converter", description: "Convert km per hour to miles per hour.", keywords: ["kmh","mph","speed","convert"], ready: true },
  { id: "mm-to-inches", name: "Mm to Inches", category: "converter", description: "Convert millimeters to inches.", keywords: ["mm","inches","length","convert"], ready: true },
  { id: "yards-to-meters", name: "Yards to Meters", category: "converter", description: "Convert yards to meters.", keywords: ["yards","meters","length","convert"], ready: true },
  { id: "cm-to-feet", name: "Cm to Feet and Inches", category: "converter", description: "Convert centimeters to feet and inches.", keywords: ["cm","feet","inches","length","convert"], ready: true },
  { id: "cm-to-mm", name: "CM to MM Converter", category: "converter", description: "Convert centimeters to millimeters.", keywords: ["cm","mm","length","convert"], ready: true },
  { id: "inches-to-mm", name: "Inches to Mm", category: "converter", description: "Convert inches to millimeters.", keywords: ["inches","mm","length","convert"], ready: true },
];

/** Quick lookup by id. */
export const CALC_BY_ID: Record<string, CalcMeta> = Object.fromEntries(
  CALCULATORS.map(c => [c.id, c]),
);

/** Popular calculators for homepage shortcuts. */
export const POPULAR_IDS = [
  "universal", "percentage", "bmi", "tax-us", "age",
  "loan", "scientific", "discount", "vat", "roi", "compound-interest",
  "word-counter", "sip", "currency-converter", "online-timer", "conv-universal",
];

export function searchCalculators(query: string): CalcMeta[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return CALCULATORS.filter(c => {
    const haystack = (c.name + " " + c.description + " " + c.keywords.join(" ")).toLowerCase();
    return haystack.includes(q) || c.keywords.some(k => k.includes(q));
  }).slice(0, 16);
}
