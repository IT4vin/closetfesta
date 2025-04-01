
import React from "react";
import LancamentoTabs from "./lancamento/LancamentoTabs";

interface NovoLancamentoFormProps {
  onClose: () => void;
}

const NovoLancamentoForm = ({ onClose }: NovoLancamentoFormProps) => {
  const handleClose = () => {
    // Ensure proper cleanup before closing
    onClose();
  };

  return <LancamentoTabs onClose={handleClose} />;
};

export default NovoLancamentoForm;
