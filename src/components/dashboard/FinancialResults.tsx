
import React, { useState } from "react";
import FinancialMetricCard from "./financial/FinancialMetricCard";
import PeriodSelector from "./financial/PeriodSelector";
import { financialDataByPeriod } from "./financial/financialResultsData";

const FinancialResults = () => {
  const [timePeriod, setTimePeriod] = useState<"day" | "week" | "month">("month");
  
  // Get the financial data for the selected time period
  const financialData = financialDataByPeriod[timePeriod];

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Resultados Financeiros</h2>
        <PeriodSelector 
          timePeriod={timePeriod} 
          setTimePeriod={setTimePeriod} 
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {financialData.map((metric, index) => (
          <FinancialMetricCard
            key={index}
            {...metric}
          />
        ))}
      </div>
    </div>
  );
};

export default FinancialResults;
