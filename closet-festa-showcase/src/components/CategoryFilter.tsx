
import { useEffect, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";

const CategoryFilter = () => {
  const { products, selectedCategory, setSelectedCategory } = useAppContext();
  const [categories, setCategories] = useState<string[]>([]);
  
  useEffect(() => {
    // Extract unique categories from products
    const uniqueCategories = Array.from(
      new Set(products.map((product) => product.category))
    );
    setCategories(uniqueCategories);
  }, [products]);
  
  return (
    <div className="flex flex-wrap gap-2 my-4">
      <Button
        variant={selectedCategory === "" ? "default" : "outline"}
        onClick={() => setSelectedCategory("")}
        className={selectedCategory === "" ? "bg-marsala hover:bg-marsala-dark" : ""}
      >
        Todos
      </Button>
      
      {categories.map((category) => (
        <Button
          key={category}
          variant={selectedCategory === category ? "default" : "outline"}
          onClick={() => setSelectedCategory(category)}
          className={selectedCategory === category ? "bg-marsala hover:bg-marsala-dark" : ""}
        >
          {category}
        </Button>
      ))}
    </div>
  );
};

export default CategoryFilter;
