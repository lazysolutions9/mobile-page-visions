import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "./ui/use-toast";

interface BuyerRequestDetailsPageProps {
  request: any;
  onBack: () => void;
  onViewSeller: (seller: any) => void;
}

export function BuyerRequestDetailsPage({ request, onBack, onViewSeller }: BuyerRequestDetailsPageProps) {
  if (!request) return null;

  const [responses, setResponses] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchResponses = async () => {
      if (!request?.id) return;
      
      const { data: responseData, error: responseError } = await supabase
        .from('sellerResponse')
        .select('*')
        .eq('orderId', request.id);

      if (responseError) {
        console.error('Error fetching responses:', responseError);
        toast({
          title: "Error",
          description: "Could not fetch seller responses.",
          variant: "destructive",
        });
        return;
      }
      
      if (responseData && responseData.length > 0) {
        const sellerIds = responseData.map(res => res.userId);
        const { data: sellerData, error: sellerError } = await supabase
          .from('sellerDetails')
          .select('*')
          .in('userId', sellerIds);

        if (sellerError) {
          console.error('Error fetching sellers:', sellerError);
          setResponses(responseData.map(res => ({...res, seller: { shopName: 'Unknown Seller' }})));
        } else {
          const sellersMap = new Map(sellerData.map(seller => [seller.userId, seller]));
          const combinedResponses = responseData.map(response => ({
            ...response,
            seller: sellersMap.get(response.userId)
          }));
          setResponses(combinedResponses);
        }
      } else {
        setResponses([]);
      }
    };

    fetchResponses();
  }, [request, toast]);

  const handleFooterAction = (action: 'resend' | 'close') => {
    console.log(`Request ${request.id} has been ${action}d.`);
    onBack();
  }

  return (
    <div>
      <main className="p-6 space-y-4 pb-24">
        <p className="text-sm text-muted-foreground -mt-2 mb-4">{request.name} - Submitted 5 mins ago</p>
        <h2 className="text-lg font-semibold">Seller Responses ({responses.length})</h2>
        <div className="space-y-4">
          {responses.length > 0 ? (
            responses.map((response) => (
              <Card key={response.id} className="cursor-pointer" onClick={() => onViewSeller(response.seller)}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold">{response.seller?.shopName || 'Awaiting response'}</p>
                  </div>
                  <p className="text-muted-foreground">{response.notes || 'No notes provided.'}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-4">No sellers have responded yet.</p>
          )}
        </div>
        <div className="pt-4 flex gap-4">
          <Button variant="outline" className="w-full" onClick={() => handleFooterAction('resend')}>Resend Request</Button>
          <Button className="w-full" onClick={() => handleFooterAction('close')}>Close Request</Button>
        </div>
      </main>
    </div>
  );
} 