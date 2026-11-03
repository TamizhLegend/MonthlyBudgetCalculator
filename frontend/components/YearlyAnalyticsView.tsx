import React, { useState, useMemo } from 'react';
import { MonthExpenseData, ExpenseCategory } from '../types';
import { MONTH_NAMES, CATEGORY_COLORS, DEFAULT_CATEGORY_COLOR } from '../constants';
import { formatCurrency } from '../utils/formatCurrency';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, Sector
} from 'recharts';
import { 
  TrendingUp, DollarSign, Calendar, Award, 
  PieChart as PieIcon, BarChart3, Layers, Filter, CheckCircle2, ChevronRight
} from 'lucide-react';

interface YearlyAnalyticsViewProps {
  selectedYear: number;
  availableYears: number[];
  onYearChange: (year: number) => void;
  monthsData: MonthExpenseData[];
  onSelectMonthForEdit: (month: MonthExpenseData) => void;
}

// Active shape renderer for interactive Pie Chart
const renderActiveShape = (props: any) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, value, percent
  } = props;

  return (
    <g>
      <text x={cx} y={cy - 10} dy={8} textAnchor="middle" fill="#0f172a" className="text-sm font-bold">
        {payload.name}
      </text>
      <text x={cx} y={cy + 12} dy={8} textAnchor="middle" fill="#64748b" className="text-xs font-semibold">
        {formatCurrency(value)} ({(percent * 100).toFixed(1)}%)
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 11}
        outerRadius={outerRadius + 14}
        fill={fill}
      />
    </g>
  );
};

export const YearlyAnalyticsView: React.FC<YearlyAnalyticsViewProps> = ({
  selectedYear,
  availableYears,
  onYearChange,
  monthsData,
  onSelectMonthForEdit,
}) => {
  // Filter for currently selected year
  const yearMonths = useMemo(
    () => monthsData.filter((m) => m.year === selectedYear),
    [monthsData, selectedYear]
  );

  // Overall calculations
  const totalYearSpent = useMemo(
    () => yearMonths.reduce(
      (acc, m) => acc + m.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
      0
    ),
    [yearMonths]
  );

  const activeMonthCount = yearMonths.length;
  const averageMonthlySpend = activeMonthCount > 0 ? totalYearSpent / activeMonthCount : 0;

  // Pie chart active slice state
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);

  // Selected category filter (for highlighting in stacked bar chart)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

  // Collect all unique categories present in the current year
  const allCategoriesInYear = useMemo(() => {
    const set = new Set<string>();
    yearMonths.forEach((m) => {
      m.items.forEach((item) => {
        if (item.category) set.add(item.category);
      });
    });
    // Ensure base categories are prioritized if they exist
    const baseCats = Object.values(ExpenseCategory);
    const sorted = Array.from(set).sort((a, b) => {
      const idxA = baseCats.indexOf(a as ExpenseCategory);
      const idxB = baseCats.indexOf(b as ExpenseCategory);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
    return sorted;
  }, [yearMonths]);

  // Aggregate category breakdown for the Pie Chart and category table
  const categoryChartData = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    yearMonths.forEach((m) => {
      m.items.forEach((item) => {
        const cat = item.category || 'Other';
        categoryMap[cat] = (categoryMap[cat] || 0) + (Number(item.amount) || 0);
      });
    });

    return Object.entries(categoryMap)
      .map(([name, value]) => ({
        name,
        value: parseFloat(value.toFixed(2)),
        color: CATEGORY_COLORS[name]?.hex || DEFAULT_CATEGORY_COLOR.hex,
      }))
      .sort((a, b) => b.value - a.value);
  }, [yearMonths]);

  const topCategory = categoryChartData[0] || null;

  // Monthly Stacked Bar Chart dataset: 12 months (Jan-Dec) with each category amount
  const stackedMonthlyData = useMemo(() => {
    return MONTH_NAMES.map((monthName, idx) => {
      const monthNum = idx + 1;
      const foundMonth = yearMonths.find((m) => m.month === monthNum);

      const row: Record<string, any> = {
        monthName: monthName.slice(0, 3),
        fullName: monthName,
        monthNum,
        hasData: Boolean(foundMonth && foundMonth.items.length > 0),
        rawMonth: foundMonth || null,
        total: 0,
      };

      // Initialize all categories with 0
      allCategoriesInYear.forEach((cat) => {
        row[cat] = 0;
      });

      if (foundMonth) {
        foundMonth.items.forEach((item) => {
          const cat = item.category || 'Other';
          const val = Number(item.amount) || 0;
          row[cat] = parseFloat(((row[cat] || 0) + val).toFixed(2));
          row.total = parseFloat(((row.total || 0) + val).toFixed(2));
        });
      }

      return row;
    });
  }, [yearMonths, allCategoriesInYear]);

  // Find peak spending month
  const highestMonth = useMemo(() => {
    if (yearMonths.length === 0) return null;
    return [...yearMonths].sort((a, b) => {
      const totalA = a.items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
      const totalB = b.items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
      return totalB - totalA;
    })[0];
  }, [yearMonths]);

  const highestMonthTotal = useMemo(() => {
    return highestMonth ? highestMonth.items.reduce((s, i) => s + (Number(i.amount) || 0), 0) : 0;
  }, [highestMonth]);

  // Custom Tooltip for Stacked Bar Chart
  const CustomStackedTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const monthRow = payload[0]?.payload;
      const activeItems = payload.filter((p: any) => p.value > 0);
      const monthTotal = monthRow?.total || 0;

      return (
        <div className="bg-white/95 backdrop-blur-xs p-3.5 rounded-xl border border-slate-200 shadow-xl max-w-xs text-xs z-30">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2 font-bold text-slate-800">
            <span>{monthRow?.fullName} {selectedYear}</span>
            <span className="text-brand-600 font-black">
              {formatCurrency(monthTotal)}
            </span>
          </div>

          {activeItems.length === 0 ? (
            <p className="text-slate-400 italic">No expenses recorded</p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {activeItems.map((entry: any) => {
                const pct = monthTotal > 0 ? ((entry.value / monthTotal) * 100).toFixed(1) : '0';
                return (
                  <div key={entry.name} className="flex items-center justify-between gap-3">
                    <span className="flex items-center space-x-1.5 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                      <span className="text-slate-600 truncate">{entry.name}</span>
                    </span>
                    <span className="font-semibold text-slate-900 shrink-0">
                      {formatCurrency(entry.value)} <span className="text-slate-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {monthRow?.rawMonth && (
            <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-brand-600 font-medium flex items-center justify-end">
              <span>Click month column to edit &rarr;</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* Year Banner with Quick Stats */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Annual Overview & Breakdown
            </h2>
            <span className="bg-brand-600 text-white font-bold text-sm px-3 py-1 rounded-full shadow-xs">
              {selectedYear}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Aggregated statistics for all months registered under {selectedYear}.
          </p>
        </div>

        {/* Year Selector */}
        <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 px-2 uppercase">Select Year:</span>
          {availableYears.map((yr) => (
            <button
              key={yr}
              onClick={() => onYearChange(yr)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedYear === yr
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              {yr}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Year Spend */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Year Spend</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {formatCurrency(totalYearSpent)}
          </p>
          <span className="text-xs text-slate-500 mt-1 inline-block">
            Across {activeMonthCount} recorded month{activeMonthCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Monthly Average */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Avg. Monthly Spend</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-brand-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {formatCurrency(averageMonthlySpend)}
          </p>
          <span className="text-xs text-slate-500 mt-1 inline-block">
            Per active month in {selectedYear}
          </span>
        </div>

        {/* Top Spending Category */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Top Category</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <p className="text-lg font-black text-slate-900 mt-2 truncate">
            {topCategory ? topCategory.name : 'N/A'}
          </p>
          <span className="text-xs text-purple-700 font-semibold mt-1 inline-block">
            {topCategory ? `${formatCurrency(topCategory.value)} (${totalYearSpent > 0 ? Math.round((topCategory.value / totalYearSpent) * 100) : 0}%)` : 'No data'}
          </span>
        </div>

        {/* Highest Spending Month */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Peak Month</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <p className="text-lg font-black text-slate-900 mt-2">
            {highestMonth ? `${highestMonth.monthName}` : 'N/A'}
          </p>
          <span className="text-xs text-amber-700 font-semibold mt-1 inline-block">
            {highestMonth ? formatCurrency(highestMonthTotal) : 'No records'}
          </span>
        </div>
      </div>

      {/* Interactive Charts Section: 1. Stacked Bar Chart & 2. Interactive Category Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Chart 1: Stacked Bar Chart comparing category spend across each month (8 columns) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-brand-600" />
                  Monthly Category Breakdown (Stacked)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comparison of category expenditure for each month in {selectedYear}. Hover bars for itemized amounts.
                </p>
              </div>

              {/* Category Highlight Filter Toggle */}
              {selectedCategoryFilter && (
                <button
                  onClick={() => setSelectedCategoryFilter(null)}
                  className="self-start sm:self-auto text-xs px-2.5 py-1 bg-brand-50 text-brand-700 font-semibold rounded-lg border border-brand-200 hover:bg-brand-100 transition-colors flex items-center gap-1"
                >
                  <span>Reset highlight: {selectedCategoryFilter}</span>
                  <span className="font-bold">&times;</span>
                </button>
              )}
            </div>

            {/* Quick Interactive Category Pill Bar */}
            {allCategoriesInYear.length > 0 && (
              <div className="flex items-center flex-wrap gap-1.5 pt-3 pb-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase mr-1 flex items-center">
                  <Filter className="h-3 w-3 mr-1" />
                  Highlight:
                </span>
                {allCategoriesInYear.map((cat) => {
                  const isSelected = selectedCategoryFilter === cat;
                  const catColor = CATEGORY_COLORS[cat]?.hex || DEFAULT_CATEGORY_COLOR.hex;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategoryFilter(isSelected ? null : cat)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all flex items-center space-x-1.5 border ${
                        isSelected
                          ? 'ring-2 ring-brand-500 font-bold shadow-xs bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: catColor }} />
                      <span className="truncate max-w-[120px]">{cat}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Stacked Chart Container */}
          <div className="h-80 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stackedMonthlyData}
                margin={{ top: 15, right: 10, left: -10, bottom: 0 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]?.payload?.rawMonth) {
                    onSelectMonthForEdit(e.activePayload[0].payload.rawMonth);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="monthName" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(val) => formatCurrency(val, { compact: true })}
                />
                <Tooltip content={<CustomStackedTooltip />} />
                
                {/* Dynamically render stacked Bar layers for all categories in the year */}
                {allCategoriesInYear.map((cat, idx) => {
                  const color = CATEGORY_COLORS[cat]?.hex || DEFAULT_CATEGORY_COLOR.hex;
                  const isFiltered = selectedCategoryFilter && selectedCategoryFilter !== cat;
                  const isTopItem = idx === allCategoriesInYear.length - 1;

                  return (
                    <Bar
                      key={cat}
                      dataKey={cat}
                      name={cat}
                      stackId="monthlyCategories"
                      fill={color}
                      opacity={isFiltered ? 0.2 : 1}
                      radius={isTopItem ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                      maxBarSize={44}
                      cursor="pointer"
                    />
                  );
                })}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Tip: Click on any month bar with recorded entries to quickly edit its expense sheet.</span>
            <span className="font-semibold text-slate-700">{selectedYear} Full Year</span>
          </div>
        </div>

        {/* Chart 2: Interactive Category Pie Chart (5 columns) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <PieIcon className="h-5 w-5 text-purple-600" />
                  Category Spending Distribution
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hover or tap slices to inspect share of total {formatCurrency(totalYearSpent, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>

            {categoryChartData.length === 0 ? (
              <div className="py-24 text-center text-slate-400 text-sm">
                No expense categories recorded for {selectedYear} yet.
              </div>
            ) : (
              <div className="h-64 w-full flex items-center justify-center my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      activeIndex={activePieIndex !== null ? activePieIndex : undefined}
                      activeShape={renderActiveShape}
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={88}
                      paddingAngle={3}
                      dataKey="value"
                      onMouseEnter={(_, index) => setActivePieIndex(index)}
                      onMouseLeave={() => setActivePieIndex(null)}
                      onClick={(_, index) => {
                        const cat = categoryChartData[index]?.name;
                        setSelectedCategoryFilter(selectedCategoryFilter === cat ? null : cat);
                      }}
                      cursor="pointer"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke={activePieIndex === index ? '#ffffff' : 'transparent'}
                          strokeWidth={2}
                          opacity={
                            selectedCategoryFilter && selectedCategoryFilter !== entry.name ? 0.35 : 1
                          }
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Legend and category breakdown badges */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Distribution Breakdown ({categoryChartData.length} categories)
            </span>

            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {categoryChartData.map((item, idx) => {
                const isHovered = activePieIndex === idx;
                const isFiltered = selectedCategoryFilter === item.name;
                const pct = totalYearSpent > 0 ? ((item.value / totalYearSpent) * 100).toFixed(1) : '0';

                return (
                  <div
                    key={item.name}
                    onMouseEnter={() => setActivePieIndex(idx)}
                    onMouseLeave={() => setActivePieIndex(null)}
                    onClick={() => setSelectedCategoryFilter(isFiltered ? null : item.name)}
                    className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                      isHovered || isFiltered
                        ? 'bg-slate-100 font-semibold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="flex items-center space-x-2 truncate max-w-[65%]">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="truncate">{item.name}</span>
                    </span>
                    <span className="font-semibold text-slate-900 shrink-0">
                      {formatCurrency(item.value)}
                      <span className="text-slate-400 font-normal ml-1.5">({pct}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Category Detailed Table for the Entire Year */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-brand-600" />
              Full Category Spend Table ({selectedYear})
            </h3>
            <p className="text-xs text-slate-500">
              Detailed totals, percentage contribution, and monthly averages for each category
            </p>
          </div>

          {selectedCategoryFilter && (
            <div className="flex items-center gap-2 text-xs bg-brand-50 text-brand-800 px-3 py-1.5 rounded-lg border border-brand-200">
              <span>Filtered by <strong>{selectedCategoryFilter}</strong></span>
              <button
                onClick={() => setSelectedCategoryFilter(null)}
                className="font-bold text-brand-600 hover:text-brand-900 ml-1"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {categoryChartData.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No expenses recorded for {selectedYear} yet. Click "Add Month" to get started!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5">Expense Category</th>
                  <th className="py-3 px-5">Annual Amount</th>
                  <th className="py-3 px-5">% of Annual Spend</th>
                  <th className="py-3 px-5">Monthly Average</th>
                  <th className="py-3 px-5 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categoryChartData.map((cat) => {
                  const pct = totalYearSpent > 0 ? (cat.value / totalYearSpent) * 100 : 0;
                  const catMonthlyAvg = activeMonthCount > 0 ? cat.value / activeMonthCount : 0;
                  const isSelected = selectedCategoryFilter === cat.name;

                  return (
                    <tr
                      key={cat.name}
                      onClick={() => setSelectedCategoryFilter(isSelected ? null : cat.name)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-brand-50/70 font-semibold' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-3 px-5 font-medium text-slate-900 flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        <span>{cat.name}</span>
                        {isSelected && (
                          <span className="text-[10px] bg-brand-200 text-brand-800 px-1.5 py-0.5 rounded font-bold">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-5 font-bold text-slate-900">
                        {formatCurrency(cat.value)}
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center space-x-2">
                          <div className="w-28 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: cat.color }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-600">{pct.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-slate-600 font-medium">
                        {formatCurrency(catMonthlyAvg)} / mo
                      </td>
                      <td className="py-3 px-5 text-right">
                        <button
                          type="button"
                          className="text-xs text-brand-600 hover:text-brand-800 font-medium inline-flex items-center gap-1"
                        >
                          {isSelected ? 'Unhighlight' : 'Highlight in Chart'}
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
