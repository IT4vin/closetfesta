import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";

const CategoryFilter = () => {
  const { categories, selectedCategory, setSelectedCategory } = useAppContext();
  
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
          key={category.id}
          variant={selectedCategory === category.name ? "default" : "outline"}
          onClick={() => setSelectedCategory(category.name)}
          className={selectedCategory === category.name ? "bg-marsala hover:bg-marsala-dark" : ""}
        >
          {category.name}
        </Button>
      ))}
    </div>
  );
};

export default CategoryFilter;
