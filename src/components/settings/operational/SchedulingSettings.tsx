
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import WorkingHoursSection from "./scheduling/WorkingHoursSection";
import SchedulingConfigSection from "./scheduling/SchedulingConfigSection";

const SchedulingSettings = () => {
  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        <WorkingHoursSection />
        <SchedulingConfigSection />
      </div>
      
      <div className="flex justify-end">
        <Button>Salvar Configurações</Button>
      </div>
    </div>
  );
};

export default SchedulingSettings;
