import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Heart } from "lucide-react";

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  mainImageUrl?: string;
  isNew?: boolean;
}

const ProductCard = ({ id, name, slug, price, mainImageUrl, isNew }: ProductCardProps) => {
  return (
    <Card className="group overflow-hidden transition-all hover:shadow-elegant">
      <Link to={`/product/${slug}`}>
        <div className="aspect-square overflow-hidden bg-muted">
          {mainImageUrl ? (
            <img
              src={mainImageUrl}
              alt={name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}
        </div>
      </Link>
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/product/${slug}`} className="flex-1">
            <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
              {name}
            </h3>
          </Link>
          {isNew && (
            <Badge variant="secondary" className="shrink-0">
              New
            </Badge>
          )}
        </div>
        <p className="text-lg font-bold text-primary mt-2">
          ${price.toFixed(2)}
        </p>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button className="flex-1" size="sm">
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Cart
        </Button>
        <Button variant="outline" size="sm">
          <Heart className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
