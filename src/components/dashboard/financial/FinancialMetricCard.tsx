
import React from "react";
import { ArrowUpRight, ArrowDownRight, InfoIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MetricDetail {
  label: string;
  value: string;
}

export interface FinancialMetricProps {
  title: string;
  value: string;
  change: number;
  period: string;
  icon: React.ReactNode;
  color: string;
  details?: MetricDetail[];
}

const FinancialMetricCard = ({ title, value, change, period, icon, color, details }: FinancialMetricProps) => {
  return (
    <div className="premium-card p-6 h-full">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
          {icon}
        </div>
        <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${change >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {change >= 0 ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
          <span>{Math.abs(change)}%</span>
        </div>
      </div>
      
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-gray-500 text-sm mb-1">{title}</h3>
          <p className="text-2xl font-semibold">{value}</p>
          <p className="text-gray-500 text-xs mt-1">{period}</p>
        </div>
        
        {details && (
          <Popover>
            <PopoverTrigger asChild>
              <button className="text-neutral-400 hover:text-neutral-600 transition-colors mt-1">
                <InfoIcon size={18} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-0" align="end" side="top">
              <div className="p-3 border-b">
                <p className="text-sm font-medium">{title} - Detalhes</p>
              </div>
              <div className="p-3 space-y-2">
                {details.map((detail, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-sm text-neutral-500">{detail.label}:</span>
                    <span className="text-sm font-medium">{detail.value}</span>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
};

export default FinancialMetricCard;
