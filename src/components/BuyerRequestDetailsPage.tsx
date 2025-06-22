import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

// Mock data for seller responses
const sellerResponses = [
  { id: 1, shopName: "QuickMed", response: "Accepted - Ready in 10 mins", price: 15.99 },
  { id: 2, shopName: "HealthFirst Pharmacy", response: "Accepted - Will deliver in 30 mins", price: 17.50 },
  { id: 3, shopName: "Med-Express", response: "Sorry, out of stock", price: null },
];

interface BuyerRequestDetailsPageProps {
  request: any;
  onBack: () => void;
  onViewSeller: (seller: any) => void;
}

export function BuyerRequestDetailsPage({ request, onBack, onViewSeller }: BuyerRequestDetailsPageProps) {
  if (!request) return null;

  const handleFooterAction = (action: 'resend' | 'close') => {
    console.log(`Request ${request.id} has been ${action}d.`);
    onBack();
  }

  return (
    <div className="flex flex-col h-full">
      <header className="bg-white shadow-sm border-b p-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Request Details</h1>
          <p className="text-sm text-muted-foreground">{request.name} - Submitted 5 mins ago</p>
        </div>
      </header>
      <main className="flex-1 p-6 space-y-4 overflow-y-auto">
        <h2 className="text-lg font-semibold">Seller Responses ({sellerResponses.length})</h2>
        <div className="space-y-4">
          {sellerResponses.map((seller) => (
            <Card key={seller.id} className="cursor-pointer" onClick={() => onViewSeller(seller)}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <p className="font-semibold">{seller.shopName}</p>
                  {seller.price !== null && (
                    <p className="font-bold text-lg">${seller.price}</p>
                  )}
                </div>
                <p className="text-muted-foreground">{seller.response}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <footer className="p-4 bg-white border-t flex gap-4">
        <Button variant="outline" className="w-full" onClick={() => handleFooterAction('resend')}>Resend Request</Button>
        <Button className="w-full" onClick={() => handleFooterAction('close')}>Close Request</Button>
      </footer>
    </div>
  );
} 