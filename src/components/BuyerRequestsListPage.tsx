import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ChevronRight } from "lucide-react";

// Mock data for buyer's requests
const allRequests = [
  { id: 1, name: 'Aspirin', status: 'Active', responses: 3 },
  { id: 2, name: 'Ibuprofen 200mg', status: 'Active', responses: 5 },
  { id: 3, name: 'Vitamin C Tablets', status: 'Closed', responses: 4 },
  { id: 4, name: 'Cough Syrup', status: 'Active', responses: 1 },
];

interface BuyerRequestsListPageProps {
  onBack: () => void;
  onViewRequestDetails: (request: any) => void;
}

export function BuyerRequestsListPage({ onBack, onViewRequestDetails }: BuyerRequestsListPageProps) {
  return (
    <div className="flex flex-col h-full">
      <header className="bg-white shadow-sm border-b p-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-bold">My Requests</h1>
      </header>
      <main className="flex-1 p-6 space-y-4 overflow-y-auto">
        <div className="space-y-4">
          {allRequests.map((request) => (
            <Card key={request.id} className="cursor-pointer" onClick={() => onViewRequestDetails(request)}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{request.name}</p>
                  <p className="text-sm text-muted-foreground">{request.status} - {request.responses} responses</p>
                </div>
                <ChevronRight className="text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
} 