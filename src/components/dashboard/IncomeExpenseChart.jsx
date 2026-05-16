// src/components/dashboard/IncomeExpenseChart.jsx
import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight, 
  Activity, BarChart3, LineChart, DollarSign, Wallet, 
  AlertTriangle, CheckCircle2, ArrowUpRight, ArrowDownRight,
  Sparkles, Calendar, HelpCircle, Inbox
} from 'lucide-react';

/**
 * IncomeExpenseChart - Spending trend visualization
 * Compact version with full functionality
 */
const IncomeExpenseChart = ({ data, transactions, timeframe, enhancedData, loading, error }) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  const [selectedWeek, setSelectedWeek] = useState(() => {
    if (selectedMonth === currentMonth && selectedYear === currentYear) {
      return Math.min(Math.ceil(now.getDate() / 7), 5);
    }
    return 1;
  });
  
  const [selectedMetric, setSelectedMetric] = useState('net');
  const [hoveredDay, setHoveredDay] = useState(null);
  const [chartMode, setChartMode] = useState('area');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showScoreTooltip, setShowScoreTooltip] = useState(false);
  const [showTrendTooltip, setShowTrendTooltip] = useState(false);
  const chartRef = useRef(null);
  const scoreTooltipRef = useRef(null);
  const trendTooltipRef = useRef(null);

  const colors = {
    income: { main: '#065F46', light: '#047857', bg: '#A7F3D0' },
    expense: { main: '#991B1B', light: '#B91C1C', bg: '#FECACA' },
    trend: {
      increasing: '#991B1B',
      decreasing: '#065F46',
      stable: '#92400E',
    },
    zones: {
      healthy: { bg: '#A7F3D0', border: '#34D399', text: '#022C22' },
      caution: { bg: '#FDE68A', border: '#F59E0B', text: '#451A03' },
      danger: { bg: '#FECACA', border: '#F87171', text: '#450A0A' },
    },
    chart: {
      grid: '#D1D5DB',
      axis: '#6B7280',
      text: '#374151',
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (scoreTooltipRef.current && !scoreTooltipRef.current.contains(event.target)) {
        setShowScoreTooltip(false);
      }
      if (trendTooltipRef.current && !trendTooltipRef.current.contains(event.target)) {
        setShowTrendTooltip(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const monthInfo = useMemo(() => {
    const date = new Date(selectedYear, selectedMonth);
    const today = new Date();
    const isCurrentMonth = selectedMonth === today.getMonth() && selectedYear === today.getFullYear();
    const isPastMonth = date < new Date(today.getFullYear(), today.getMonth(), 1);
    const isFutureMonth = date > today;
    
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const totalWeeks = Math.ceil(lastDay / 7);
    
    return {
      name: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      isCurrentMonth,
      isPastMonth,
      isFutureMonth,
      totalWeeks,
      canGoNext: !isCurrentMonth && !isFutureMonth,
      canGoPrev: true,
    };
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (monthInfo.isCurrentMonth) {
      const currentWeek = Math.min(Math.ceil(now.getDate() / 7), monthInfo.totalWeeks);
      setSelectedWeek(currentWeek);
    } else if (monthInfo.isPastMonth) {
      if (selectedWeek > monthInfo.totalWeeks) {
        setSelectedWeek(monthInfo.totalWeeks);
      }
    } else if (monthInfo.isFutureMonth) {
      setSelectedWeek(1);
    }
  }, [selectedMonth, selectedYear, monthInfo.isCurrentMonth, monthInfo.isPastMonth, monthInfo.isFutureMonth, monthInfo.totalWeeks]);

  const getWeekDateRange = useCallback((weekNumber, month, year) => {
    const weekStart = new Date(year, month, (weekNumber - 1) * 7 + 1);
    let weekEnd;
    
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const totalWeeks = Math.ceil(lastDayOfMonth / 7);
    
    if (weekNumber === totalWeeks) {
      weekEnd = new Date(year, month + 1, 0);
    } else {
      weekEnd = new Date(year, month, weekNumber * 7);
    }
    
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (weekStart > today) {
      return { weekStart, weekEnd, isFuture: true, isEmpty: true };
    }
    
    if (weekEnd > today) {
      weekEnd = new Date(today);
    }
    
    return { weekStart, weekEnd, isFuture: false, isEmpty: false };
  }, []);

  const navigateMonth = useCallback((direction) => {
    setIsTransitioning(true);
    
    setTimeout(() => {
      if (direction === 'prev') {
        if (selectedMonth === 0) {
          setSelectedMonth(11);
          setSelectedYear(prev => prev - 1);
        } else {
          setSelectedMonth(prev => prev - 1);
        }
      } else if (direction === 'next' && monthInfo.canGoNext) {
        if (selectedMonth === 11) {
          setSelectedMonth(0);
          setSelectedYear(prev => prev + 1);
        } else {
          setSelectedMonth(prev => prev + 1);
        }
      }
      setIsTransitioning(false);
    }, 200);
  }, [selectedMonth, selectedYear, monthInfo.canGoNext]);

  const chartData = useMemo(() => {
    if (!transactions?.length) {
      const weekStart = new Date(selectedYear, selectedMonth, (selectedWeek - 1) * 7 + 1);
      return { 
        noData: true, 
        reason: 'no_transactions',
        weekStart,
        weekEnd: new Date(selectedYear, selectedMonth, selectedWeek * 7),
        totalWeeks: monthInfo.totalWeeks,
        monthName: weekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      };
    }

    const dateRange = getWeekDateRange(selectedWeek, selectedMonth, selectedYear);
    if (!dateRange) {
      return { 
        noData: true, 
        reason: 'invalid',
        totalWeeks: monthInfo.totalWeeks,
        monthName: new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      };
    }

    const { weekStart, weekEnd, isFuture } = dateRange;

    if (isFuture) {
      return { 
        noData: true, 
        reason: 'future', 
        weekStart, 
        weekEnd,
        totalWeeks: monthInfo.totalWeeks,
        monthName: weekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      };
    }

    const dailyData = [];
    let currentDate = new Date(weekStart);
    
    while (currentDate <= weekEnd) {
      const dateKey = currentDate.toISOString().split('T')[0];
      dailyData.push({
        date: new Date(currentDate),
        dateKey,
        income: 0,
        expenses: 0,
        net: 0,
        transactions: [],
        label: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
        fullLabel: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dayNumber: currentDate.getDate(),
        isToday: dateKey === new Date().toISOString().split('T')[0],
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    let hasData = false;
    transactions.forEach(tx => {
      const txDate = tx.date?.split('T')[0];
      if (!txDate) return;
      
      const dayEntry = dailyData.find(d => d.dateKey === txDate);
      if (dayEntry) {
        if (tx.type === 'income') dayEntry.income += tx.amount;
        else dayEntry.expenses += Math.abs(tx.amount);
        dayEntry.net = dayEntry.income - dayEntry.expenses;
        dayEntry.transactions.push(tx);
        hasData = true;
      }
    });

    if (!hasData) {
      return { 
        noData: true, 
        reason: 'empty_week', 
        weekStart, 
        weekEnd,
        totalWeeks: monthInfo.totalWeeks,
        monthName: weekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      };
    }

    const extendedHistory = [];
    const historyStart = new Date(weekStart);
    historyStart.setDate(historyStart.getDate() - 6);

    for (let d = new Date(historyStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      let dayIncome = 0, dayExpenses = 0;
      
      transactions.forEach(tx => {
        if (tx.date?.split('T')[0] === dateKey) {
          if (tx.type === 'income') dayIncome += tx.amount;
          else dayExpenses += Math.abs(tx.amount);
        }
      });
      
      extendedHistory.push({ dateKey, income: dayIncome, expenses: dayExpenses, net: dayIncome - dayExpenses });
    }

    const withRolling = dailyData.map(day => {
      const dayIndex = extendedHistory.findIndex(h => h.dateKey === day.dateKey);
      const window = extendedHistory.slice(Math.max(0, dayIndex - 6), dayIndex + 1);
      const count = window.length || 1;
      
      return {
        ...day,
        rollingIncome: window.reduce((s, h) => s + h.income, 0) / count,
        rollingExpenses: window.reduce((s, h) => s + h.expenses, 0) / count,
        rollingNet: window.reduce((s, h) => s + h.net, 0) / count,
      };
    });

    const totalIncome = dailyData.reduce((s, d) => s + d.income, 0);
    const totalExpenses = dailyData.reduce((s, d) => s + d.expenses, 0);
    const netCashFlow = totalIncome - totalExpenses;
    const avgDailyNet = dailyData.length > 0 ? netCashFlow / dailyData.length : 0;
    
    const bestDay = [...dailyData].sort((a, b) => b.net - a.net)[0];
    const worstDay = [...dailyData].sort((a, b) => a.net - b.net)[0];

    const rollingNets = withRolling.map(d => d.rollingNet);
    const midPoint = Math.floor(rollingNets.length / 2);
    const firstHalf = rollingNets.slice(0, midPoint);
    const secondHalf = rollingNets.slice(midPoint);
    
    const firstAvg = firstHalf.length ? firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length : 0;
    const secondAvg = secondHalf.length ? secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length : 0;
    
    const trendChange = secondAvg - firstAvg;
    const trendPercent = firstAvg !== 0 ? Math.abs((trendChange / Math.abs(firstAvg)) * 100) : 0;
    
    let trendDirection = 'stable';
    if (trendPercent > 5) trendDirection = trendChange > 0 ? 'increasing' : 'decreasing';
    
    const trendLabel = trendDirection === 'increasing' ? 'Increasing' : 
                       trendDirection === 'decreasing' ? 'Decreasing' : 'Stabilizing';

    const getTrendMessage = () => {
      if (selectedMetric === 'expenses') {
        return trendDirection === 'increasing' ? 'Spending rising' : 
               trendDirection === 'decreasing' ? 'Spending falling' : 'Spending stable';
      } else if (selectedMetric === 'income') {
        return trendDirection === 'increasing' ? 'Income growing' : 
               trendDirection === 'decreasing' ? 'Income declining' : 'Income stable';
      } else {
        return trendDirection === 'increasing' ? 'Cash flow improving' : 
               trendDirection === 'decreasing' ? 'Cash flow declining' : 'Cash flow stable';
      }
    };

    const getTrendColorValue = () => {
      if (selectedMetric === 'expenses') {
        return trendDirection === 'increasing' ? colors.trend.increasing :
               trendDirection === 'decreasing' ? colors.trend.decreasing : colors.trend.stable;
      } else if (selectedMetric === 'income') {
        return trendDirection === 'increasing' ? colors.trend.decreasing :
               trendDirection === 'decreasing' ? colors.trend.increasing : colors.trend.stable;
      } else {
        return trendDirection === 'increasing' ? colors.trend.decreasing :
               trendDirection === 'decreasing' ? colors.trend.increasing : colors.trend.stable;
      }
    };

    const activeDays = dailyData.length;
    const surplusDays = dailyData.filter(d => d.net >= 0).length;
    
    const surplusRatio = activeDays > 0 ? Math.round((surplusDays / activeDays) * 40) : 0;
    const avgScore = avgDailyNet >= 20 ? 30 : avgDailyNet >= 0 ? 20 : avgDailyNet >= -30 ? 10 : 0;
    const trendScore = trendDirection === 'decreasing' && selectedMetric === 'expenses' ? 30 : 
                       trendDirection === 'increasing' && selectedMetric === 'income' ? 30 : 
                       trendDirection === 'stable' ? 15 : 0;
    
    const healthScore = Math.min(100, Math.max(0, surplusRatio + avgScore + trendScore));

    return {
      dailyData: withRolling,
      weekStart,
      weekEnd,
      totalIncome,
      totalExpenses,
      netCashFlow,
      avgDailyNet,
      bestDay,
      worstDay,
      trendDirection,
      trendLabel,
      trendMessage: getTrendMessage(),
      trendPercent: trendPercent.toFixed(1),
      trendColorValue: getTrendColorValue(),
      healthScore,
      scoreBreakdown: {
        surplusRatio,
        avgScore,
        trendScore,
      },
      surplusDays,
      deficitDays: activeDays - surplusDays,
      totalWeeks: monthInfo.totalWeeks,
      activeDays,
      monthName: weekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    };
  }, [transactions, selectedWeek, selectedMonth, selectedYear, selectedMetric, getWeekDateRange, monthInfo.totalWeeks]);

  const getValue = useCallback((day, useRolling = false) => {
    if (!day) return 0;
    const key = useRolling ? `rolling${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}` : selectedMetric;
    return day[key] || 0;
  }, [selectedMetric]);

  const dimensions = { width: 1000, height: 225, padding: { top: 18, right: 18, bottom: 40, left: 75 } };
  const plotWidth = dimensions.width - dimensions.padding.left - dimensions.padding.right;
  const plotHeight = dimensions.height - dimensions.padding.top - dimensions.padding.bottom;

  const chartScales = useMemo(() => {
    if (!chartData?.dailyData) return null;
    
    const allValues = chartData.dailyData.flatMap(d => [
      getValue(d, false),
      getValue(d, true)
    ]);
    
    const maxAbs = Math.max(...allValues.map(Math.abs), 10);
    const yMax = maxAbs * 1.25;
    
    return {
      yMax,
      scaleX: (index) => dimensions.padding.left + (index / Math.max(chartData.dailyData.length - 1, 1)) * plotWidth,
      scaleY: (value) => dimensions.padding.top + plotHeight / 2 - (value / yMax) * (plotHeight / 2),
      zeroY: dimensions.padding.top + plotHeight / 2,
    };
  }, [chartData, getValue]);

  const trendColor = chartData?.trendColorValue || colors.trend.stable;

  const generatePaths = (useRolling = false) => {
    if (!chartData?.dailyData || !chartScales) return null;
    
    const points = chartData.dailyData.map((d, i) => ({
      x: chartScales.scaleX(i),
      y: chartScales.scaleY(getValue(d, useRolling))
    }));
    
    if (points.length < 2) return null;
    
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartScales.zeroY} L ${points[0].x} ${chartScales.zeroY} Z`;
    
    return { linePath, areaPath };
  };

  const actualPaths = generatePaths(false);
  const rollingPaths = generatePaths(true);

  const handleTrendClick = () => {
    setShowTrendTooltip(!showTrendTooltip);
    setShowScoreTooltip(false);
  };

  const handleScoreClick = () => {
    setShowScoreTooltip(!showScoreTooltip);
    setShowTrendTooltip(false);
  };

  // ===== EMPTY STATES =====
  
  if (!transactions?.length && !loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Spending Trend Analysis</h3>
        <div className="flex flex-col items-center justify-center py-10">
          <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-3">
            <Inbox className="text-gray-300" size={24} />
          </div>
          <p className="text-sm text-gray-500 text-center">Add transactions to see spending trends</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Spending Trend Analysis</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-3 bg-gray-200 rounded w-32"></div>
          <div className="h-40 bg-gray-50 rounded-lg"></div>
          <div className="grid grid-cols-4 gap-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-8 bg-gray-100 rounded-md"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Spending Trend Analysis</h3>
        <div className="flex items-start space-x-2 p-3 bg-red-50 rounded-lg border border-red-100">
          <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={14} />
          <p className="text-xs text-red-700">Unable to load chart. {error}</p>
        </div>
      </div>
    );
  }

  if (chartData?.noData) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Spending Trend Analysis</h3>
        {renderMonthNavigation()}
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mb-2">
            {chartData.reason === 'future' ? (
              <Calendar className="text-gray-300" size={20} />
            ) : (
              <Activity className="text-gray-300" size={20} />
            )}
          </div>
          <p className="text-xs font-medium text-gray-700 mb-1">
            {chartData.reason === 'future' ? 'This week hasn\'t occurred yet' : 'No activity for this week'}
          </p>
          <p className="text-[10px] text-gray-500 text-center max-w-xs mb-3">
            {chartData.reason === 'future' 
              ? 'Navigate to a past week to view your data.'
              : `No transactions for Week ${selectedWeek}. Try a different week or month.`
            }
          </p>
          {chartData.reason === 'future' && (
            <button
              onClick={() => {
                setSelectedMonth(currentMonth);
                setSelectedYear(currentYear);
                setSelectedWeek(Math.min(Math.ceil(now.getDate() / 7), 5));
              }}
              className="px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md hover:bg-gray-800 transition-colors"
            >
              Go to current
            </button>
          )}
          {chartData.reason === 'empty_week' && (
            <div className="flex space-x-1">
              {Array.from({ length: chartData.totalWeeks || 4 }, (_, i) => i + 1).map((week) => (
                <button
                  key={week}
                  onClick={() => setSelectedWeek(week)}
                  className="px-2 py-1 text-[10px] rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                >
                  W{week}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!chartData?.dailyData?.length || !chartScales) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Spending Trend Analysis</h3>
        {renderMonthNavigation()}
        <div className="flex items-center justify-center py-8">
          <p className="text-xs text-gray-500">No data available for this period</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-3 pb-1">
        <h3 className="text-sm font-semibold text-gray-900">Spending Trend Analysis</h3>
      </div>

      <div className="px-4 pb-2">
        {renderMonthNavigation()}

        {/* Trend + Controls Row */}
        <div className="flex items-center justify-between mb-2">
          {/* Trend Indicator */}
          <div className="relative" ref={trendTooltipRef}>
            <button
              onClick={handleTrendClick}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[13px] font-medium transition-all duration-200 cursor-help"
              style={{ 
                backgroundColor: trendColor === colors.trend.increasing ? '#FEF2F2' :
                                trendColor === colors.trend.decreasing ? '#ECFDF5' : '#FFFBEB',
                color: trendColor,
              }}
            >
              {chartData.trendDirection === 'increasing' ? (
                <ArrowUpRight size={15} />
              ) : chartData.trendDirection === 'decreasing' ? (
                <ArrowDownRight size={15} />
              ) : (
                <Minus size={15} />
              )}
              <span>{chartData.trendLabel}</span>
              <span className="opacity-75">{chartData.trendPercent}%</span>
              <HelpCircle size={13} className="opacity-60" />
            </button>

            <AnimatePresence>
  {showTrendTooltip && (
    <motion.div
      initial={{ opacity: 0, y: 3, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 3, scale: 0.95 }}
      className="absolute top-full left-0 mt-1.5 w-56 bg-gray-900 text-white rounded-lg p-3 shadow-xl z-50"
    >
      <div className="text-[12px] font-semibold mb-1.5">Trend Guide</div>
      <div className="space-y-1.5 text-[11px]">
        <div className="flex items-start space-x-1.5">
          <ArrowUpRight size={13} className="text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-emerald-400 font-medium">Increasing</span>
            <p className="text-gray-400 text-[10px]">
              {selectedMetric === 'expenses' ? 'Spending falling — great job' :
               selectedMetric === 'income' ? 'Income growing — positive' :
               'Cash flow improving — good sign'}
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-1.5">
          <Minus size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-amber-400 font-medium">Stabilizing</span>
            <p className="text-gray-400 text-[10px]">
              {selectedMetric === 'expenses' ? 'Spending consistent — maintain' :
               selectedMetric === 'income' ? 'Income steady — explore growth' :
               'Cash flow stable'}
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-1.5">
          <ArrowDownRight size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-red-400 font-medium">Decreasing</span>
            <p className="text-gray-400 text-[10px]">
              {selectedMetric === 'expenses' ? 'Spending rising — review budget' :
               selectedMetric === 'income' ? 'Income declining — investigate' :
               'Cash flow declining — take action'}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-1.5">
            <div className="flex bg-gray-100 rounded-md p-0.5">
              {[
                { key: 'net', label: 'Net' },
                { key: 'income', label: 'Income' },
                { key: 'expenses', label: 'Expenses' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSelectedMetric(key)}
                  className={`px-2.5 py-1 text-[12px] font-medium rounded transition-all duration-200 ${
                    selectedMetric === key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex bg-gray-100 rounded-md p-0.5">
              <button
                onClick={() => setChartMode('area')}
                className={`p-1 rounded transition-all duration-200 ${
                  chartMode === 'area' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
                aria-label="Area chart"
              >
                <LineChart size={15} className={chartMode === 'area' ? 'text-gray-900' : 'text-gray-500'} />
              </button>
              <button
                onClick={() => setChartMode('bar')}
                className={`p-1 rounded transition-all duration-200 ${
                  chartMode === 'bar' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
                aria-label="Bar chart"
              >
                <BarChart3 size={15} className={chartMode === 'bar' ? 'text-gray-900' : 'text-gray-500'} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CHART */}
      <div className="px-2 pb-1">
        <motion.div 
          className="relative bg-gradient-to-b from-gray-50/80 to-gray-50/20 rounded-lg overflow-hidden"
          animate={{ opacity: isTransitioning ? 0.5 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <svg
            ref={chartRef}
            viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
            className="w-full"
            preserveAspectRatio="xMidYMid meet"
            style={{ maxHeight: '255px' }}
            aria-label={`Spending trend chart for ${chartData.monthName} Week ${selectedWeek}`}
          >
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={trendColor} stopOpacity="0.15" />
                <stop offset="100%" stopColor={trendColor} stopOpacity="0.01" />
              </linearGradient>
              
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>

              <filter id="barShadow">
                <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.06"/>
              </filter>
            </defs>

            {/* Zone backgrounds */}
            <rect x={dimensions.padding.left} y={dimensions.padding.top}
                  width={plotWidth} height={plotHeight * 0.33}
                  fill={colors.zones.healthy.bg} opacity="0.4" />
            <rect x={dimensions.padding.left} y={dimensions.padding.top + plotHeight * 0.33}
                  width={plotWidth} height={plotHeight * 0.34}
                  fill={colors.zones.caution.bg} opacity="0.2" />
            <rect x={dimensions.padding.left} y={dimensions.padding.top + plotHeight * 0.67}
                  width={plotWidth} height={plotHeight * 0.33}
                  fill={colors.zones.danger.bg} opacity="0.2" />

            {/* Zone labels */}
            <text x={dimensions.padding.left + 8} y={dimensions.padding.top + 8} 
                  className="text-[13px] fill-emerald-800/60" fontWeight="600">Healthy</text>
            <text x={dimensions.padding.left + 8} y={dimensions.height - dimensions.padding.bottom - 65} 
                  className="text-[13px] fill-amber-800/70" fontWeight="600">Caution</text>
            <text x={dimensions.padding.left + 8} y={dimensions.height - dimensions.padding.bottom + 2} 
                  className="text-[13px] fill-red-800/60" fontWeight="600">Risk</text>

            {/* Grid lines */}
            {[0.5].map(factor => (
              <g key={factor}>
                <line x1={dimensions.padding.left} y1={chartScales.scaleY(chartScales.yMax * factor)}
                      x2={dimensions.width - dimensions.padding.right} y2={chartScales.scaleY(chartScales.yMax * factor)}
                      stroke={colors.chart.grid} strokeWidth="0.5" strokeDasharray="3,3" />
                <line x1={dimensions.padding.left} y1={chartScales.scaleY(-chartScales.yMax * factor)}
                      x2={dimensions.width - dimensions.padding.right} y2={chartScales.scaleY(-chartScales.yMax * factor)}
                      stroke={colors.chart.grid} strokeWidth="0.5" strokeDasharray="3,3" />
              </g>
            ))}

            {/* Zero line */}
            <line x1={dimensions.padding.left} y1={chartScales.zeroY}
                  x2={dimensions.width - dimensions.padding.right} y2={chartScales.zeroY}
                  stroke={colors.chart.axis} strokeWidth="1" />

            {/* Area fill */}
            {chartMode === 'area' && actualPaths && (
              <path d={actualPaths.areaPath} fill="url(#areaGradient)" className="transition-all duration-300" />
            )}

            {/* Bars */}
            {chartMode === 'bar' && chartData.dailyData.map((day, index) => {
              const value = getValue(day, false);
              const x = chartScales.scaleX(index);
              const barWidth = Math.max((plotWidth / chartData.dailyData.length) * 0.55, 8);
              const y = chartScales.scaleY(Math.max(0, value));
              const height = Math.abs(chartScales.scaleY(value) - chartScales.zeroY);
              const isHovered = hoveredDay?.dateKey === day.dateKey;

              return (
                <g key={`bar-${index}`} className="cursor-pointer"
                   onMouseEnter={() => setHoveredDay(day)}
                   onMouseLeave={() => setHoveredDay(null)}>
                  <rect x={x - barWidth / 2} y={value >= 0 ? y : chartScales.zeroY}
                        width={barWidth} height={Math.max(height, 1)} rx="3"
                        fill={value >= 0 ? colors.income.main : colors.expense.main}
                        opacity={isHovered ? 0.8 : 0.5}
                        filter="url(#barShadow)" />
                  {isHovered && (
                    <rect x={x - barWidth / 2 - 1} y={(value >= 0 ? y : chartScales.zeroY) - 1}
                          width={barWidth + 2} height={Math.max(height, 1) + 2} rx="4"
                          fill="none" stroke={value >= 0 ? colors.income.main : colors.expense.main}
                          strokeWidth="1" />
                  )}
                </g>
              );
            })}

            {/* Actual line */}
            {chartMode === 'area' && actualPaths && (
              <path d={actualPaths.linePath} fill="none" stroke={trendColor}
                    strokeWidth="1" strokeOpacity="0.35" strokeDasharray="4,3"
                    className="transition-all duration-300" />
            )}

            {/* Trend line */}
            {rollingPaths && (
              <>
                <path d={rollingPaths.linePath} fill="none" stroke={trendColor}
                      strokeWidth="3.5" strokeOpacity="0.1" strokeLinecap="round"
                      strokeLinejoin="round" filter="url(#glow)"
                      className="transition-all duration-300" />
                <path d={rollingPaths.linePath} fill="none" stroke={trendColor}
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className="transition-all duration-300" />
              </>
            )}

            {/* Data points */}
            {chartData.dailyData.map((day, index) => {
              const value = getValue(day, true);
              const x = chartScales.scaleX(index);
              const y = chartScales.scaleY(value);
              const isHovered = hoveredDay?.dateKey === day.dateKey;

              return (
                <g key={`point-${index}`} className="cursor-pointer"
                   onMouseEnter={() => setHoveredDay(day)}
                   onMouseLeave={() => setHoveredDay(null)}>
                  <circle cx={x} cy={y} r="12" fill="transparent" />
                  <circle cx={x} cy={y} r={isHovered ? 4.5 : 3.5}
                          fill="white" stroke={trendColor}
                          strokeWidth={isHovered ? 2 : 1.5}
                          className="transition-all duration-200" />
                  {day.isToday && (
                    <circle cx={x} cy={y} r="7" fill="none" stroke={trendColor}
                            strokeWidth="1" strokeDasharray="2,2" className="animate-pulse" />
                  )}
                </g>
              );
            })}

            {/* Y-axis labels */}
            <text x={dimensions.padding.left - 12} y={chartScales.scaleY(chartScales.yMax) + 5} 
                  textAnchor="end" className="text-[13px] fill-gray-500" fontWeight="500">
              ${Math.round(chartScales.yMax)}
            </text>
            <text x={dimensions.padding.left - 12} y={chartScales.zeroY + 5} 
                  textAnchor="end" className="text-[13px] fill-gray-500" fontWeight="500">
              $0
            </text>
            <text x={dimensions.padding.left - 12} y={chartScales.scaleY(-chartScales.yMax) + 5} 
                  textAnchor="end" className="text-[13px] fill-gray-500" fontWeight="500">
              -${Math.round(chartScales.yMax)}
            </text>

            {/* X-axis labels */}
            {chartData.dailyData.map((day, index) => {
              const x = chartScales.scaleX(index);
              const isHovered = hoveredDay?.dateKey === day.dateKey;
              
              return (
                <g key={`xlabel-${index}`}>
                  <text x={x} y={dimensions.height - dimensions.padding.bottom + 20}
                        textAnchor="middle"
                        className={`text-[13px] transition-colors duration-200 ${isHovered ? 'fill-gray-900 font-semibold' : 'fill-gray-500'}`}>
                    {day.label}
                  </text>
                  <text x={x} y={dimensions.height - 2}
                        textAnchor="middle"
                        className={`text-[12px] transition-colors duration-200 ${isHovered ? 'fill-gray-700' : 'fill-gray-400'}`}>
                    {day.dayNumber}
                  </text>
                </g>
              );
            })}

            {/* Tooltip */}
            {hoveredDay && (
              <g className="pointer-events-none">
                <rect x={Math.min(Math.max(chartScales.scaleX(chartData.dailyData.indexOf(hoveredDay)) - 55, 
                             dimensions.padding.left), dimensions.width - dimensions.padding.right - 110)}
                      y={dimensions.padding.top - 2} width="110" height="50" rx="6"
                      fill="white" stroke={colors.chart.axis} strokeWidth="0.5"
                      filter="url(#barShadow)" />
                <text x={Math.min(Math.max(chartScales.scaleX(chartData.dailyData.indexOf(hoveredDay)), 
                             dimensions.padding.left + 55), dimensions.width - dimensions.padding.right - 55)}
                      y={dimensions.padding.top + 12} textAnchor="middle"
                      className="text-[13px] fill-gray-600 font-medium">
                  {hoveredDay.fullLabel}
                </text>
                <text x={Math.min(Math.max(chartScales.scaleX(chartData.dailyData.indexOf(hoveredDay)), 
                             dimensions.padding.left + 55), dimensions.width - dimensions.padding.right - 55)}
                      y={dimensions.padding.top + 28} textAnchor="middle"
                      className="text-sm font-bold"
                      fill={getValue(hoveredDay, false) >= 0 ? colors.income.main : colors.expense.main}>
                  ${Math.abs(getValue(hoveredDay, false)).toFixed(2)}
                </text>
                <text x={Math.min(Math.max(chartScales.scaleX(chartData.dailyData.indexOf(hoveredDay)), 
                             dimensions.padding.left + 55), dimensions.width - dimensions.padding.right - 55)}
                      y={dimensions.padding.top + 40} textAnchor="middle"
                      className="text-[12px] fill-gray-400">
                  7d: ${Math.abs(getValue(hoveredDay, true)).toFixed(2)}
                </text>
              </g>
            )}
          </svg>
        </motion.div>
      </div>

      {/* STATS ROW */}
      <div className="px-4 py-2 border-t border-gray-100">
        <div className="grid grid-cols-4 gap-2">
          {/* Income */}
          <div className="flex items-center space-x-1.5 p-1.5 rounded-md hover:bg-gray-50 transition-colors">
            <div className="w-8 h-8 rounded-md bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <TrendingUp size={15} className="text-emerald-600" />
            </div>
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-gray-900 truncate">
                ${chartData.totalIncome.toFixed(0)}
              </div>
              <div className="text-[12px] text-gray-500">Income</div>
            </div>
          </div>

          {/* Expenses */}
          <div className="flex items-center space-x-1.5 p-1.5 rounded-md hover:bg-gray-50 transition-colors">
            <div className="w-8 h-8 rounded-md bg-red-50 flex items-center justify-center flex-shrink-0">
              <TrendingDown size={15} className="text-red-600" />
            </div>
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-gray-900 truncate">
                ${chartData.totalExpenses.toFixed(0)}
              </div>
              <div className="text-[12px] text-gray-500">Expenses</div>
            </div>
          </div>

          {/* Net */}
          <div className="flex items-center space-x-1.5 p-1.5 rounded-md hover:bg-gray-50 transition-colors">
            <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${
              chartData.netCashFlow >= 0 ? 'bg-emerald-50' : 'bg-red-50'
            }`}>
              <Wallet size={15} className={chartData.netCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'} />
            </div>
            <div className="min-w-0">
              <div className={`text-[14px] font-semibold truncate ${
                chartData.netCashFlow >= 0 ? 'text-emerald-700' : 'text-red-700'
              }`}>
                {chartData.netCashFlow >= 0 ? '+' : ''}{chartData.netCashFlow.toFixed(0)}
              </div>
              <div className="text-[12px] text-gray-500">Net</div>
            </div>
          </div>

          {/* Health Score - Tooltip ABOVE */}
          <div 
            className="relative flex items-center space-x-1.5 p-1.5 rounded-md hover:bg-gray-50 transition-colors cursor-help"
            ref={scoreTooltipRef}
            onClick={handleScoreClick}
          >
            <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${
              chartData.healthScore >= 70 ? 'bg-emerald-50' :
              chartData.healthScore >= 40 ? 'bg-amber-50' : 'bg-red-50'
            }`}>
              <Sparkles size={15} className={
                chartData.healthScore >= 70 ? 'text-emerald-600' :
                chartData.healthScore >= 40 ? 'text-amber-600' : 'text-red-600'
              } />
            </div>
            <div className="min-w-0">
              <div className={`text-[14px] font-semibold ${
                chartData.healthScore >= 70 ? 'text-emerald-700' :
                chartData.healthScore >= 40 ? 'text-amber-700' : 'text-red-700'
              }`}>
                {chartData.healthScore}
              </div>
              <div className="text-[12px] text-gray-500 flex items-center">
                Score
                <HelpCircle size={8} className="ml-0.5 text-gray-400" />
              </div>
            </div>

            {/* Score Tooltip - ABOVE the block */}
            <AnimatePresence>
              {showScoreTooltip && (
                <motion.div
                  initial={{ opacity: 0, y: -3, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -3, scale: 0.95 }}
                  className="absolute bottom-full left-0 -translate-x-1/4 mb-2 w-36 bg-gray-900 text-white rounded-lg p-2 shadow-xl z-50"
                >
                  <div className="text-[10px] font-semibold mb-1 text-center">Score Breakdown</div>
                  <div className="space-y-0.5 text-[9px]">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Surplus days</span>
                      <span className="text-white font-medium">{chartData.scoreBreakdown.surplusRatio}/40</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Avg daily</span>
                      <span className="text-white font-medium">{chartData.scoreBreakdown.avgScore}/30</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Trend</span>
                      <span className="text-white font-medium">{chartData.scoreBreakdown.trendScore}/30</span>
                    </div>
                    <div className="border-t border-gray-700 pt-0.5 mt-0.5 flex justify-between">
                      <span className="text-gray-400">Total</span>
                      <span className="text-white font-bold">{chartData.healthScore}/100</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom insight */}
        <div className="mt-2 flex items-center space-x-1.5 text-[10px] text-gray-500">
          <CheckCircle2 size={10} className="text-gray-400 flex-shrink-0" />
          <span className="truncate">
            {chartData.surplusDays}/{chartData.activeDays} surplus · 
            Best: {chartData.bestDay?.label} · 
            {chartData.trendMessage}
          </span>
        </div>
      </div>
    </div>
  );

  // Month navigation
  function renderMonthNavigation() {
    return (
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-1 rounded-md hover:bg-gray-100 transition-all duration-200"
            aria-label="Previous month"
          >
            <ChevronLeft size={18} className="text-gray-600" />
          </button>
          <div className="flex items-center space-x-1.5">
            <Calendar size={16} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-900">{monthInfo.name}</span>
            {monthInfo.isCurrentMonth && (
              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-medium rounded-full">
                Now
              </span>
            )}
          </div>
          <button
            onClick={() => navigateMonth('next')}
            disabled={!monthInfo.canGoNext}
            className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            aria-label="Next month"
          >
            <ChevronRight size={18} className="text-gray-600" />
          </button>
        </div>

        {/* Week selector */}
        {!chartData?.noData && chartData?.totalWeeks && (
          <div className="flex items-center space-x-0.5">
            <span className="text-[9px] text-gray-400 mr-0.5">Week</span>
            {Array.from({ length: Math.min(chartData.totalWeeks, monthInfo.isCurrentMonth ? 
              Math.min(Math.ceil(now.getDate() / 7), chartData.totalWeeks) : chartData.totalWeeks) 
            }, (_, i) => i + 1).map((week) => (
              <button
                key={week}
                onClick={() => {
                  setIsTransitioning(true);
                  setTimeout(() => {
                    setSelectedWeek(week);
                    setIsTransitioning(false);
                  }, 150);
                }}
                className={`px-1.5 py-0.5 text-[10px] font-medium rounded transition-all duration-200 ${
                  selectedWeek === week
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                {week}
              </button>
            ))}
          </div>
        )}
        
        {/* Show week selector for empty weeks too */}
        {chartData?.noData && chartData?.totalWeeks && chartData?.reason !== 'future' && (
          <div className="flex items-center space-x-0.5">
            <span className="text-[9px] text-gray-400 mr-0.5">Wk</span>
            {Array.from({ length: chartData.totalWeeks }, (_, i) => i + 1).map((week) => (
              <button
                key={week}
                onClick={() => setSelectedWeek(week)}
                className={`px-1.5 py-0.5 text-[10px] font-medium rounded transition-all duration-200 ${
                  selectedWeek === week
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                {week}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
};

export default IncomeExpenseChart;