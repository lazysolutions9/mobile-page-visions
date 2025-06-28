import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface BuyerRequestsListPageProps {
  user: any;
  onBack: () => void;
  onViewRequestDetails: (request: any) => void;
}

export function BuyerRequestsListPage({ user, onBack, onViewRequestDetails }: BuyerRequestsListPageProps) {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    const fetchRequestsAndCounts = async () => {
      if (!user) return;

      const { data: userOrders, error: ordersError } = await supabase
        .from('order')
        .select('id, itemName, created_at, pincode')
        .eq('userId', user.id)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        return;
      }
      
      const orderIds = userOrders.map(order => order.id);
      
      const { data: responses, error: responsesError } = await supabase
        .from('sellerResponse')
        .select('orderId')
        .in('orderId', orderIds);

      if (responsesError) {
        console.error('Error fetching responses:', responsesError);
        // Continue without response counts
      }

      const responseCounts = (responses || []).reduce((acc: any, res) => {
        acc[res.orderId] = (acc[res.orderId] || 0) + 1;
        return acc;
      }, {});

      const combinedData = userOrders.map(order => ({
        ...order,
        name: order.itemName,
        status: 'Active', // This can be updated if you add a status to your order table
        responses: responseCounts[order.id] || 0,
        pincode: order.pincode,
      }));

      setRequests(combinedData);
    };

    fetchRequestsAndCounts();
  }, [user]);

  return (
    <div>
      <main className="p-6 space-y-4 pb-24">
        <div className="space-y-4">
          {requests.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">You have not made any requests.</p>
          ) : (
            requests.map((request) => (
              <Card key={request.id} className="cursor-pointer" onClick={() => onViewRequestDetails(request)}>
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{request.name}</p>
                    <p className="text-sm text-muted-foreground">{request.status} - {request.responses} responses</p>
                  </div>
                  <ChevronRight className="text-muted-foreground" />
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
} 