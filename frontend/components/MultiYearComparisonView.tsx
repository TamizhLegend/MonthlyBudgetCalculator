import React, { useState, useMemo } from 'react';
import { MonthExpenseData, ExpenseCategory } from '../types';
import { MONTH_NAMES, CATEGORY_COLORS, DEFAULT_CATEGORY_COLOR, YEAR_PALETTES } from '../constants';
import { formatCurrency } from '../utils/formatCurrency';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, LineChart, Line
} from 'recharts';
import { 
  GitCompare, TrendingUp, TrendingDown, DollarSign, Calendar, 
  CheckSquare, Square, Layers, ArrowUpRight, ArrowDownRight, 
  Percent, Scale, AlertCircle, Info
} from 'lucide-react';

interface MultiYearComparisonViewProps {
  monthsData: MonthExpenseData[];
  availableYears: number[];
  onAddNewMonthForYear?: (year: number) => void;
}

export const MultiYearComparisonView: React.FC<MultiYearComparisonViewProps> = ({
  monthsData,
  availableYears,
  onAddNewMonthForYear,
}) => {
  // Sort available years ascending for intuitive selection and progression
  const sortedAvailableYears = useMemo(
    () => [...availableYears].sort((a, b) => a - b),
    [availableYears]
  );

  // Default to selecting the last 2 available years if possible
  const [selectedYears, setSelectedYears] = useState<number[]>(() => {
    if (sortedAvailableYears.length >= 2) {
      return sortedAvailableYears.slice(-2);
    }
    return sortedAvailableYears.slice(-1);
  });

  // Toggle year selection
  const handleToggleYear = (year: number) => {
    setSelectedYears((prev) => {
      if (prev.includes(year)) {
        if (prev.length <= 1) return prev; // Keep at least one year selected
        return prev.filter((y) => y !== year);
      } else {
        return [...prev, year].sort((a, b) => a - b);
      }
    });
  };

  // Quick preset helper
  const handleSelectAllYears = () => {
    setSelectedYears(sortedAvailableYears);
  };

  // Group months data by year
  const yearDataMap = useMemo(() => {
    const map = new Map<number, MonthExpenseData[]>();
    sortedAvailableYears.forEach((yr) => {
      map.set(yr, monthsData.filter((m) => m.year === yr));
    });
    return map;
  }, [sortedAvailableYears, monthsData]);

  // Aggregate stats per selected year
  const yearlyStats = useMemo(() => {
    return selectedYears.map((yr, idx) => {
      const yearMonths = yearDataMap.get(yr) || [];
      const totalSpend = yearMonths.reduce(
        (sum, m) => sum + m.items.reduce((s, it) => s + (Number(it.amount) || 0), 0),
        0
      );
      const totalItems = yearMonths.reduce((sum, m) => sum + m.items.length, 0);
      const activeMonthsCount = yearMonths.length;
      const avgMonthly = activeMonthsCount > 0 ? totalSpend / activeMonthsCount : 0;
      const palette = YEAR_PALETTES[idx % YEAR_PALETTES.length];

      // Category map for this year
      const categoryTotals: Record<string, number> = {};
      yearMonths.forEach((m) => {
        m.items.forEach((it) => {
          const cat = it.category || 'Other';
          categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(it.amount) || 0);
        });
      });

      return {
        year: yr,
        totalSpend,
        totalItems,
        activeMonthsCount,
        avgMonthly,
        categoryTotals,
        palette,
      };
    });
  }, [selectedYears, yearDataMap]);

  // Overall list of all unique categories present across selected years
  const allComparedCategories = useMemo(() => {
    const set = new Set<string>();
    selectedYears.forEach((yr) => {
      const yearMonths = yearDataMap.get(yr) || [];
      yearMonths.forEach((m) => {
        m.items.forEach((it) => {
          if (it.category) set.add(it.category);
        });
      });
    });
    const baseCats = Object.values(ExpenseCategory);
    return Array.from(set).sort((a, b) => {
      const idxA = baseCats.indexOf(a as ExpenseCategory);
      const idxB = baseCats.indexOf(b as ExpenseCategory);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [selectedYears, yearDataMap]);

  // Dataset for Grouped Category Bar Chart
  const categoryComparisonChartData = useMemo(() => {
    return allComparedCategories.map((cat) => {
      const row: Record<string, any> = {
        category: cat,
      };
      yearlyStats.forEach((yStat) => {
        row[String(yStat.year)] = parseFloat((yStat.categoryTotals[cat] || 0).toFixed(2));
      });
      return row;
    });
  }, [allComparedCategories, yearlyStats]);

  // Dataset for Monthly Trajectory (Jan-Dec) Line/Bar Chart
  const monthlyTrajectoryChartData = useMemo(() => {
    return MONTH_NAMES.map((mName, idx) => {
      const monthNum = idx + 1;
      const row: Record<string, any> = {
        month: mName.slice(0, 3),
        fullName: mName,
      };

      yearlyStats.forEach((yStat) => {
        const yearMonths = yearDataMap.get(yStat.year) || [];
        const found = yearMonths.find((m) => m.month === monthNum);
        const spend = found ? found.items.reduce((s, it) => s + (Number(it.amount) || 0), 0) : 0;
        row[String(yStat.year)] = parseFloat(spend.toFixed(2));
      });

      return row;
    });
  }, [yearlyStats, yearDataMap]);

  // YoY Growth between baseline (first selected) and latest (last selected)
  const baselineYearStat = yearlyStats[0];
  const latestYearStat = yearlyStats[yearlyStats.length - 1];
  const hasMultipleYears = yearlyStats.length >= 2;

  const totalYoYDiff = hasMultipleYears
    ? latestYearStat.totalSpend - baselineYearStat.totalSpend
    : 0;

  const totalYoYPercent = hasMultipleYears && baselineYearStat.totalSpend > 0
    ? (totalYoYDiff / baselineYearStat.totalSpend) * 100
    : 0;

  // Custom tooltips
  const CustomCategoryTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-xs p-3.5 rounded-xl border border-slate-200 shadow-xl text-xs z-30 min-w-[200px]">
          <div className="font-bold text-slate-800 border-b border-slate-100 pb-1.5 mb-2">
            Category: {label}
          </div>
          <div className="space-y-1.5">
            {payload.map((entry: any) => (
              <div key={entry.dataKey} className="flex items-center justify-between gap-3">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="font-semibold text-slate-700">{entry.dataKey}:</span>
                </span>
                <span className="font-black text-slate-900">
                  {formatCurrency(Number(entry.value))}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Multi-Year Selector */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
              <GitCompare className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Multi-Year Expense Comparison
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select 2 or more years to evaluate side-by-side total expenditures, category shifts, and percentage growth.
              </p>
            </div>
          </div>
        </div>

        {/* Year Checkbox / Pill Selector */}
        <div className="flex items-center flex-wrap gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 w-full lg:w-auto">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
            Compare:
          </span>

          {sortedAvailableYears.map((yr, idx) => {
            const isSelected = selectedYears.includes(yr);
            const palette = YEAR_PALETTES[selectedYears.indexOf(yr) % YEAR_PALETTES.length];

            return (
              <button
                key={yr}
                onClick={() => handleToggleYear(yr)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  isSelected
                    ? 'bg-white shadow-xs border-brand-500 text-brand-700 ring-2 ring-brand-500/20'
                    : 'bg-transparent border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {isSelected ? (
                  <CheckSquare className="h-3.5 w-3.5 text-brand-600" />
                ) : (
                  <Square className="h-3.5 w-3.5 text-slate-400" />
                )}
                <span>{yr}</span>
              </button>
            );
          })}

          {sortedAvailableYears.length > 2 && (
            <button
              onClick={handleSelectAllYears}
              className="text-xs text-brand-600 hover:text-brand-800 font-semibold px-2 py-1 ml-1"
            >
              Select All
            </button>
          )}
        </div>
      </div>

      {/* Selected Years Total Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {yearlyStats.map((yStat, idx) => (
          <div
            key={yStat.year}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden"
          >
            <div
              className="absolute top-0 left-0 right-0 h-1.5"
              style={{ backgroundColor: yStat.palette.fill }}
            />
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: yStat.palette.fill }} />
                <span>{yStat.year} Total Spend</span>
              </span>
              <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md text-[11px]">
                {yStat.activeMonthsCount} mo
              </span>
            </div>

            <p className="text-2xl font-black text-slate-900 mt-2">
              {formatCurrency(yStat.totalSpend)}
            </p>

            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span>Avg/month:</span>
              <span className="font-semibold text-slate-800">
                {formatCurrency(yStat.avgMonthly)}
              </span>
            </div>
          </div>
        ))}

        {/* Growth Metric Card (comparing earliest vs latest selected) */}
        {hasMultipleYears && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 to-teal-500" />
            <div>
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <span>YoY Growth Trend</span>
                <span className="text-[10px] font-bold text-slate-400">
                  {baselineYearStat.year} &rarr; {latestYearStat.year}
                </span>
              </div>

              <div className="flex items-baseline space-x-2 mt-2">
                <span className={`text-2xl font-black flex items-center ${
                  totalYoYDiff > 0 ? 'text-rose-600' : totalYoYDiff < 0 ? 'text-emerald-600' : 'text-slate-800'
                }`}>
                  {totalYoYDiff > 0 ? '+' : ''}{totalYoYPercent.toFixed(1)}%
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  ({formatCurrency(totalYoYDiff, { signed: true })})
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 mt-2 flex items-center gap-1">
              {totalYoYDiff > 0 ? (
                <>
                  <TrendingUp className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                  <span>Annual spending increased by {formatCurrency(totalYoYDiff)}</span>
                </>
              ) : totalYoYDiff < 0 ? (
                <>
                  <TrendingDown className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Annual spending decreased by {formatCurrency(Math.abs(totalYoYDiff))}</span>
                </>
              ) : (
                <span>No change in total expenditure</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Warning message if only 1 year is selected */}
      {!hasMultipleYears && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm flex items-center">
          <Info className="h-5 w-5 mr-2 shrink-0 text-amber-600" />
          <span>
            Please check at least one more year above to unlock side-by-side category differences and YoY growth analytics.
          </span>
        </div>
      )}

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Chart 1: Grouped Bar Chart of Category Spend Across Selected Years (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-brand-600" />
                  Category Comparison by Year
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Side-by-side dollar amounts spent per category across selected years
                </p>
              </div>

              {/* Legend Badges */}
              <div className="flex items-center space-x-2">
                {yearlyStats.map((yStat) => (
                  <span
                    key={yStat.year}
                    className="inline-flex items-center space-x-1 text-xs font-bold px-2 py-0.5 rounded-full border border-slate-200"
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: yStat.palette.fill }} />
                    <span className="text-slate-800">{yStat.year}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Grouped Bar Chart */}
            <div className="h-80 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryComparisonChartData}
                  margin={{ top: 15, right: 10, left: -10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="category"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    angle={-20}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(val) => formatCurrency(val, { compact: true })}
                  />
                  <Tooltip content={<CustomCategoryTooltip />} />
                  <Legend verticalAlign="top" height={36} />

                  {yearlyStats.map((yStat) => (
                    <Bar
                      key={yStat.year}
                      dataKey={String(yStat.year)}
                      name={`${yStat.year} Total`}
                      fill={yStat.palette.fill}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={32}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Visualizes which categories expanded or shrank over time</span>
            <span className="font-semibold text-slate-700">Grouped Breakdown</span>
          </div>
        </div>

        {/* Chart 2: Monthly Pace & Trajectory Across Years (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-teal-600" />
                  Monthly Spending Pace
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Trajectory comparison across Jan-Dec for each year
                </p>
              </div>
            </div>

            <div className="h-80 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthlyTrajectoryChartData}
                  margin={{ top: 15, right: 15, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(val) => formatCurrency(val, { compact: true })}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Spend']}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Legend verticalAlign="top" height={36} />

                  {yearlyStats.map((yStat) => (
                    <Line
                      key={yStat.year}
                      type="monotone"
                      dataKey={String(yStat.year)}
                      name={`${yStat.year}`}
                      stroke={yStat.palette.stroke}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: yStat.palette.fill }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Pace tracking highlights seasonal spikes (holidays, school, renewals)</span>
            <span className="font-semibold text-slate-700">12 Months Trend</span>
          </div>
        </div>

      </div>

      {/* Comprehensive Side-by-Side Category Delta & YoY Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Scale className="h-5 w-5 text-brand-600" />
              Category Differences & Year-Over-Year Growth Table
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Itemized dollar differences and percentage variations between baseline ({baselineYearStat?.year}) and latest ({latestYearStat?.year})
            </p>
          </div>
        </div>

        {allComparedCategories.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No expenses recorded in the selected years.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5">Expense Category</th>
                  {yearlyStats.map((yStat) => (
                    <th key={yStat.year} className="py-3 px-5 text-right">
                      {yStat.year} Spend
                    </th>
                  ))}
                  {hasMultipleYears && (
                    <>
                      <th className="py-3 px-5 text-right">
                        Absolute Diff ({baselineYearStat.year} &rarr; {latestYearStat.year})
                      </th>
                      <th className="py-3 px-5 text-right">
                        YoY Growth (%)
                      </th>
                      <th className="py-3 px-5 text-center">Trend</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allComparedCategories.map((catName) => {
                  const colorDef = CATEGORY_COLORS[catName] || DEFAULT_CATEGORY_COLOR;
                  const baselineAmount = baselineYearStat?.categoryTotals[catName] || 0;
                  const latestAmount = latestYearStat?.categoryTotals[catName] || 0;
                  const diff = latestAmount - baselineAmount;
                  const pct = baselineAmount > 0
                    ? ((diff / baselineAmount) * 100)
                    : latestAmount > 0 ? 100 : 0;

                  return (
                    <tr key={catName} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-5 font-medium text-slate-900 flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: colorDef.hex }} />
                        <span className="font-semibold">{catName}</span>
                      </td>

                      {/* Columns for each year */}
                      {yearlyStats.map((yStat) => {
                        const amount = yStat.categoryTotals[catName] || 0;
                        const pctOfYr = yStat.totalSpend > 0 ? (amount / yStat.totalSpend) * 100 : 0;

                        return (
                          <td key={yStat.year} className="py-3 px-5 text-right font-medium text-slate-800">
                            <div>{formatCurrency(amount)}</div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              {pctOfYr.toFixed(1)}% of {yStat.year}
                            </div>
                          </td>
                        );
                      })}

                      {/* Multi-year comparison delta metrics */}
                      {hasMultipleYears && (
                        <>
                          <td className="py-3 px-5 text-right font-bold">
                            <span className={diff > 0 ? 'text-rose-600' : diff < 0 ? 'text-emerald-600' : 'text-slate-500'}>
                              {formatCurrency(diff, { signed: true })}
                            </span>
                          </td>

                          <td className="py-3 px-5 text-right font-bold">
                            <span
                              className={`inline-flex items-center space-x-0.5 px-2 py-0.5 rounded-full text-xs ${
                                diff > 0
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : diff < 0
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              <span>{diff > 0 ? '+' : ''}{pct.toFixed(1)}%</span>
                            </span>
                          </td>

                          <td className="py-3 px-5 text-center">
                            {diff > 0 ? (
                              <span className="inline-flex items-center text-xs text-rose-600 font-semibold" title="Expenses increased">
                                <ArrowUpRight className="h-4 w-4" />
                              </span>
                            ) : diff < 0 ? (
                              <span className="inline-flex items-center text-xs text-emerald-600 font-semibold" title="Expenses decreased">
                                <ArrowDownRight className="h-4 w-4" />
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 font-semibold">&mdash;</span>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}

                {/* Total row at the bottom */}
                <tr className="bg-slate-50 font-bold border-t-2 border-slate-200 text-slate-900">
                  <td className="py-3 px-5">Overall Annual Expenditure</td>
                  {yearlyStats.map((yStat) => (
                    <td key={yStat.year} className="py-3 px-5 text-right text-base text-brand-700">
                      {formatCurrency(yStat.totalSpend)}
                    </td>
                  ))}
                  {hasMultipleYears && (
                    <>
                      <td className="py-3 px-5 text-right text-base">
                        <span className={totalYoYDiff > 0 ? 'text-rose-600' : totalYoYDiff < 0 ? 'text-emerald-600' : 'text-slate-700'}>
                          {formatCurrency(totalYoYDiff, { signed: true })}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right text-base">
                        <span className={totalYoYDiff > 0 ? 'text-rose-600' : totalYoYDiff < 0 ? 'text-emerald-600' : 'text-slate-700'}>
                          {totalYoYDiff > 0 ? '+' : ''}{totalYoYPercent.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-5 text-center">
                        {totalYoYDiff > 0 ? (
                          <ArrowUpRight className="h-5 w-5 text-rose-600 mx-auto" />
                        ) : totalYoYDiff < 0 ? (
                          <ArrowDownRight className="h-5 w-5 text-emerald-600 mx-auto" />
                        ) : (
                          <span>&mdash;</span>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
