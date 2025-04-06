
import React from "react";

interface PeriodSelectorProps {
  timePeriod: "day" | "week" | "month";
  setTimePeriod: (period: "day" | "week" | "month") => void;
}

const PeriodSelector: React.FC<PeriodSelectorProps> = ({ timePeriod, setTimePeriod }) => {
  return (
    <div className="flex space-x-2 bg-neutral-100 p-1 rounded-lg">
      <button 
        onClick={() => setTimePeriod("day")} 
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${timePeriod === "day" ? "bg-white shadow-sm" : "text-neutral-500 hover:bg-neutral-200"}`}
      >
        Dia
      </button>
      <button 
        onClick={() => setTimePeriod("week")} 
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${timePeriod === "week" ? "bg-white shadow-sm" : "text-neutral-500 hover:bg-neutral-200"}`}
      >
        Semana
      </button>
      <button 
        onClick={() => setTimePeriod("month")} 
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${timePeriod === "month" ? "bg-white shadow-sm" : "text-neutral-500 hover:bg-neutral-200"}`}
      >
        Mês
      </button>
    </div>
  );
};

export default PeriodSelector;
