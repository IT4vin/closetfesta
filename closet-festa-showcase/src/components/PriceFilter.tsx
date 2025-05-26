
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";

const PriceFilter = () => {
  const { priceFilter, setPriceFilter } = useAppContext();
  
  return (
    <div className="flex flex-wrap gap-2 my-4">
      <Button
        variant={priceFilter === "all" ? "default" : "outline"}
        onClick={() => setPriceFilter("all")}
        className={priceFilter === "all" ? "bg-marsala hover:bg-marsala-dark" : ""}
      >
        Todos preços
      </Button>
      
      <Button
        variant={priceFilter === "rental" ? "default" : "outline"}
        onClick={() => setPriceFilter("rental")}
        className={priceFilter === "rental" ? "bg-marsala hover:bg-marsala-dark" : ""}
      >
        Aluguel
      </Button>
      
      <Button
        variant={priceFilter === "sale" ? "default" : "outline"}
        onClick={() => setPriceFilter("sale")}
        className={priceFilter === "sale" ? "bg-marsala hover:bg-marsala-dark" : ""}
      >
        Venda
      </Button>
    </div>
  );
};

export default PriceFilter;
