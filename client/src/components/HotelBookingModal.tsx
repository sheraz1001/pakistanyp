import { useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star, MapPin, Calendar, Users, CreditCard, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface HotelBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotel: any;
  searchParams: any;
  clientSecret?: string;
}

export default function HotelBookingModal({
  isOpen,
  onClose,
  hotel,
  searchParams,
  clientSecret
}: HotelBookingModalProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [confirmationNumber, setConfirmationNumber] = useState("");
  
  const [guestInfo, setGuestInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "Pakistan",
    zipCode: "",
    specialRequests: ""
  });

  // Calculate pricing
  const basePrice = hotel.price || 0;
  const taxes = Math.round(basePrice * 0.14 * 100) / 100;
  const fees = Math.round(basePrice * 0.05 * 100) / 100;
  const totalPrice = basePrice + taxes + fees;
  const nights = Math.ceil((new Date(searchParams.checkOut).getTime() - new Date(searchParams.checkIn).getTime()) / (1000 * 60 * 60 * 24));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    if (!guestInfo.firstName || !guestInfo.lastName || !guestInfo.email || !guestInfo.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required guest information fields.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/hotels",
        },
        redirect: "if_required",
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // Create booking record
        const bookingResponse = await fetch("/api/hotels/create-booking", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            hotelId: hotel.id,
            hotelName: hotel.name,
            checkIn: searchParams.checkIn,
            checkOut: searchParams.checkOut,
            adults: searchParams.adults,
            children: searchParams.children || 0,
            rooms: searchParams.rooms || 1,
            totalPrice: totalPrice,
            currency: "USD",
            firstName: guestInfo.firstName,
            lastName: guestInfo.lastName,
            email: guestInfo.email,
            phone: guestInfo.phone,
            paymentMethod: "card",
            specialRequests: guestInfo.specialRequests,
          }),
        });

        if (bookingResponse.ok) {
          const bookingData = await bookingResponse.json();
          setConfirmationNumber(bookingData.booking?.confirmationNumber || "CONFIRMED");
          setBookingComplete(true);
          
          toast({
            title: "Booking Confirmed!",
            description: "Your hotel reservation has been successfully created.",
          });
        } else {
          throw new Error("Failed to create booking record");
        }
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast({
        title: "Booking Failed",
        description: "There was an error processing your booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (bookingComplete) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-6 w-6" />
              Booking Confirmed!
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reservation Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Confirmation Number</Label>
                    <p className="text-lg font-bold text-green-600">{confirmationNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Hotel</Label>
                    <p className="font-semibold">{hotel.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Check-in</Label>
                    <p className="font-semibold">{format(new Date(searchParams.checkIn), "PPP")}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Check-out</Label>
                    <p className="font-semibold">{format(new Date(searchParams.checkOut), "PPP")}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Guests</Label>
                    <p className="font-semibold">{searchParams.adults} Adults{searchParams.children > 0 && `, ${searchParams.children} Children`}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Total Paid</Label>
                    <p className="text-lg font-bold">${totalPrice.toFixed(2)} USD</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">What's Next?</h4>
              <ul className="text-sm space-y-1 text-blue-800">
                <li>• A confirmation email has been sent to {guestInfo.email}</li>
                <li>• Please arrive at the hotel with a valid ID and this confirmation number</li>
                <li>• Contact the hotel directly for any special requests or changes</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button onClick={onClose} className="flex-1">
                Close
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.print()}
                className="flex-1"
              >
                Print Confirmation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Complete Your Booking
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hotel Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{hotel.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center">
                    {[...Array(hotel.stars || 5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-[#F59E0B] text-[#F59E0B]" />
                    ))}
                  </div>
                  <Badge variant="secondary">{hotel.stars || 5} Star Hotel</Badge>
                </div>
                <div className="flex items-center gap-1 mt-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  {hotel.location?.city || hotel.location?.address}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Check-in</span>
                  <span className="font-semibold">{format(new Date(searchParams.checkIn), "MMM dd, yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Check-out</span>
                  <span className="font-semibold">{format(new Date(searchParams.checkOut), "MMM dd, yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Duration</span>
                  <span className="font-semibold">{nights} night{nights > 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Guests</span>
                  <span className="font-semibold">{searchParams.adults} Adults{searchParams.children > 0 && `, ${searchParams.children} Children`}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Room Rate ({nights} night{nights > 1 ? 's' : ''})</span>
                  <span>${basePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Taxes & Fees</span>
                  <span>${(taxes + fees).toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${totalPrice.toFixed(2)} USD</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Guest Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={guestInfo.firstName}
                      onChange={(e) => setGuestInfo(prev => ({...prev, firstName: e.target.value}))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={guestInfo.lastName}
                      onChange={(e) => setGuestInfo(prev => ({...prev, lastName: e.target.value}))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={guestInfo.email}
                    onChange={(e) => setGuestInfo(prev => ({...prev, email: e.target.value}))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={guestInfo.phone}
                    onChange={(e) => setGuestInfo(prev => ({...prev, phone: e.target.value}))}
                    placeholder="+92 XX XXX XXXX"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="specialRequests">Special Requests</Label>
                  <Textarea
                    id="specialRequests"
                    value={guestInfo.specialRequests}
                    onChange={(e) => setGuestInfo(prev => ({...prev, specialRequests: e.target.value}))}
                    placeholder="Any special requests or preferences..."
                    rows={3}
                  />
                </div>

                {clientSecret && (
                  <div>
                    <Label>Payment Information</Label>
                    <div className="border rounded-lg p-4 mt-2">
                      <PaymentElement />
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={!stripe || isProcessing}
                >
                  {isProcessing ? "Processing..." : `Pay $${totalPrice.toFixed(2)} & Confirm Booking`}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}