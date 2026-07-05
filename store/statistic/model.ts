// Mirrors StatisticsDashboardDto from the backend (camelCased JSON).

export interface BarChartMonthIncomeExpense {
  labels: string[];
  income: number[];
  expense: number[];
}

export interface DonutChartCategoryExpense {
  categoryNames: string[];
  percentages: number[];
  amounts: number[];
  colors: string[];
}

export interface LineChartDailyExpense {
  labels: string[];
  expenses: number[];
}

export interface HorizontalBarTopCategory {
  categoryNames: string[];
  amounts: number[];
  colors: string[];
}

export interface LineChartMonthCompare {
  labels: string[];
  thisMonth: number[];
  lastMonth: number[];
}

export interface ProgressBarBudgetCategory {
  categoryNames: string[];
  budget: number[];
  spent: number[];
  isOver: boolean[];
  colors: string[];
  percent: number[];
}

export interface AreaChartBalance {
  labels: string[];
  balances: number[];
}

export interface RadarChartWeekdayExpense {
  weekdays: string[];
  expenses: number[];
}

export interface StatisticsDashboard {
  barChartMonthIncomeExpense?: BarChartMonthIncomeExpense;
  donutChartCategoryExpense?: DonutChartCategoryExpense;
  lineChartDailyExpense?: LineChartDailyExpense;
  horizontalBarTopCategory?: HorizontalBarTopCategory;
  lineChartMonthCompare?: LineChartMonthCompare;
  progressBarBudgetCategory?: ProgressBarBudgetCategory;
  areaChartBalance?: AreaChartBalance;
  radarChartWeekdayExpense?: RadarChartWeekdayExpense;
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface DailyBreakdown {
  date: string;
  income: number;
  expense: number;
}
