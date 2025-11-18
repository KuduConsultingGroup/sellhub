import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tag, Copy, Check } from "lucide-react";
import { useState } from "react";

const MyPromotions = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const promotions = [
    {
      id: "1",
      code: "WELCOME20",
      title: "Welcome Discount",
      description: "Get 20% off on your first purchase",
      discount: "20% OFF",
      validUntil: "2024-12-31",
      minOrder: 50,
      active: true,
    },
    {
      id: "2",
      code: "SUMMER2024",
      title: "Summer Sale",
      description: "Summer special - Save big on electronics",
      discount: "$30 OFF",
      validUntil: "2024-08-31",
      minOrder: 200,
      active: true,
    },
    {
      id: "3",
      code: "FREESHIP",
      title: "Free Shipping",
      description: "Free shipping on all orders above $100",
      discount: "Free Shipping",
      validUntil: "2024-12-31",
      minOrder: 100,
      active: true,
    },
    {
      id: "4",
      code: "LOYALTY15",
      title: "Loyalty Reward",
      description: "Exclusive discount for valued customers",
      discount: "15% OFF",
      validUntil: "2024-06-30",
      minOrder: 75,
      active: true,
    },
    {
      id: "5",
      code: "FLASH50",
      title: "Flash Sale",
      description: "Limited time offer - Hurry!",
      discount: "$50 OFF",
      validUntil: "2024-03-15",
      minOrder: 300,
      active: false,
    },
  ];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Promotions for You</h1>
          <p className="text-muted-foreground mt-1">
            {promotions.filter(p => p.active).length} active promotions available
          </p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Tag className="h-5 w-5 text-primary" />
          <span className="font-semibold">{promotions.filter(p => p.active).length} Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {promotions.map((promo) => (
          <Card 
            key={promo.id} 
            className={`hover:shadow-lg transition-all ${
              promo.active 
                ? "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20" 
                : "opacity-60"
            }`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{promo.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{promo.description}</p>
                </div>
                {promo.active ? (
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary">Expired</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-background/50 backdrop-blur-sm border border-primary/20">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl font-bold text-primary">{promo.discount}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleCopyCode(promo.code)}
                    disabled={!promo.active}
                  >
                    {copiedCode === promo.code ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-mono bg-muted px-3 py-2 rounded inline-block">
                    {promo.code}
                  </p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Valid until: {promo.validUntil}</p>
                    <p>Minimum order: ${promo.minOrder}</p>
                  </div>
                </div>
              </div>
              {promo.active && (
                <Button className="w-full">
                  Apply & Shop Now
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MyPromotions;
