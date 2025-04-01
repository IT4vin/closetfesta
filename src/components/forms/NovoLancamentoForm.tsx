
import React from "react";
import LancamentoTabs from "./lancamento/LancamentoTabs";

interface NovoLancamentoFormProps {
  onClose: () => void;
}

const NovoLancamentoForm = ({ onClose }: NovoLancamentoFormProps) => {
  return <LancamentoTabs onClose={onClose} />;
};

export default NovoLancamentoForm;
