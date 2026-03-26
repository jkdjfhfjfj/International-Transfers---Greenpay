import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Save, DollarSign, CheckCircle, AlertCircle, Tag } from "lucide-react";

export default function CardPriceManagement() {
  const [newPrice, setNewPrice] = useState("60.00");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: currentPriceData, isLoading } = useQuery({
    queryKey: ["/api/system-settings/card-price"],
  });

  const { data: discountData } = useQuery({
    queryKey: ["/api/system-settings/discount-enabled"],
    queryFn: async () => {
      const r = await apiRequest("GET", "/api/system-settings/discount-enabled");
      return r.json();
    },
  });

  const currentPrice = (currentPriceData as any)?.price || "60.00";
  const discountEnabled = (discountData as any)?.enabled !== false;

  useEffect(() => {
    if (currentPrice) setNewPrice(currentPrice);
  }, [currentPrice]);

  const updatePriceMutation = useMutation({
    mutationFn: async (price: string) => {
      const response = await apiRequest("PUT", "/api/system-settings/card-price", {
        price: parseFloat(price).toFixed(2),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Price Updated", description: "Virtual card price has been updated successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/system-settings/card-price"] });
      queryClient.invalidateQueries({ queryKey: ["/api/virtual-card"] });
    },
    onError: () => {
      toast({ title: "Update Failed", description: "Failed to update card price.", variant: "destructive" });
    },
  });

  const toggleDiscountMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const r = await apiRequest("PUT", "/api/system-settings/discount-enabled", { enabled });
      return r.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.enabled ? "Discount Enabled" : "Discount Hidden",
        description: data.enabled
          ? "The discount badge is now visible to users."
          : "The discount badge is now hidden from users.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/system-settings/discount-enabled"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update discount setting.", variant: "destructive" });
    },
  });

  const handleSave = () => {
    const price = parseFloat(newPrice);
    if (isNaN(price) || price <= 0) {
      toast({ title: "Invalid Price", description: "Please enter a valid price greater than 0.", variant: "destructive" });
      return;
    }
    updatePriceMutation.mutate(newPrice);
  };

  const priceChanged = parseFloat(newPrice) !== parseFloat(currentPrice);
  const originalPrice = "60.00";
  const discountPct = parseFloat(currentPrice) < parseFloat(originalPrice)
    ? Math.round((1 - parseFloat(currentPrice) / parseFloat(originalPrice)) * 100)
    : 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" /> Card Price Management
          </CardTitle>
          <CardDescription>Loading current price...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Card Price & Discount</h2>
          <p className="text-gray-600 mt-1">Configure virtual card pricing and discount display for users</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <CreditCard className="w-4 h-4" /> Pricing Settings
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Price Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" /> Current Price
            </CardTitle>
            <CardDescription>The current price users see for virtual cards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">${currentPrice}</div>
            {discountPct > 0 && discountEnabled && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm line-through text-gray-400">${originalPrice}</span>
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">{discountPct}% OFF</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500" /> Active price displayed to users
            </div>
          </CardContent>
        </Card>

        {/* Price Update Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" /> Update Price
            </CardTitle>
            <CardDescription>Set a new price for virtual card purchases</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="card-price">New Card Price (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="card-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="pl-10"
                  placeholder="60.00"
                  data-testid="input-card-price"
                />
              </div>
              <p className="text-xs text-gray-500">
                Original price is $60.00. Set a lower price to show a discount badge to users.
              </p>
            </div>

            {priceChanged && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  Price change: ${currentPrice} → ${parseFloat(newPrice).toFixed(2)}
                  {parseFloat(newPrice) < 60 ? ` (${Math.round((1 - parseFloat(newPrice) / 60) * 100)}% discount)` : ""}
                </span>
              </div>
            )}

            <Button
              onClick={handleSave}
              disabled={!priceChanged || updatePriceMutation.isPending}
              className="w-full"
              data-testid="button-save-price"
            >
              <Save className="w-4 h-4 mr-2" />
              {updatePriceMutation.isPending ? "Updating..." : "Update Price"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Discount Control */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-red-500" /> Discount Display Control
          </CardTitle>
          <CardDescription>
            Control whether the discount badge is shown to users on the virtual card purchase page.
            The badge only shows if the current price is lower than the original $60.00.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl">
            <div>
              <p className="font-medium text-sm">Show Discount Badge</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {discountEnabled
                  ? "Users can see the discount offer on the card purchase page"
                  : "Discount badge is hidden — users see the regular price"}
              </p>
            </div>
            <Switch
              checked={discountEnabled}
              onCheckedChange={(checked) => toggleDiscountMutation.mutate(checked)}
              disabled={toggleDiscountMutation.isPending}
              data-testid="switch-discount-enabled"
            />
          </div>
          {discountPct > 0 && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className="text-xs text-green-700">
                Current discount: <strong>{discountPct}% OFF</strong> (from $60.00 → ${currentPrice})
                {discountEnabled ? " — visible to users" : " — hidden from users"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information */}
      <Card>
        <CardHeader><CardTitle>How It Works</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Automatic Discount Calculation</p>
              <p className="text-sm text-gray-600">
                Set any price below $60.00 and a discount percentage is automatically calculated and shown.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Toggle Visibility</p>
              <p className="text-sm text-gray-600">
                Use the toggle above to show or hide the discount badge without changing the price.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Instant Effect</p>
              <p className="text-sm text-gray-600">
                Price and discount changes take effect immediately for all new card purchases.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
