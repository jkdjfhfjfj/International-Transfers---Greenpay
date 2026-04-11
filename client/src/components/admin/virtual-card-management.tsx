import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CreditCard,
  Search,
  Eye,
  Lock,
  Unlock,
  User,
  Calendar,
  DollarSign,
  ShieldOff,
  EyeOff,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface VirtualCard {
  id: string;
  userId: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardHolderName: string;
  status: string;
  freezeReason?: string | null;
  blockReason?: string | null;
  balance: string;
  currency: string;
  purchaseDate: string;
  lastUsed: string | null;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
}

interface VirtualCardsResponse {
  virtualCards: VirtualCard[];
}

export default function VirtualCardManagement() {
  const [search, setSearch] = useState("");
  const [selectedCard, setSelectedCard] = useState<VirtualCard | null>(null);
  const [viewDialogCard, setViewDialogCard] = useState<VirtualCard | null>(null);
  const [showCvv, setShowCvv] = useState(false);

  const [freezeDialogCard, setFreezeDialogCard] = useState<VirtualCard | null>(null);
  const [freezeReason, setFreezeReason] = useState("");

  const [blockDialogCard, setBlockDialogCard] = useState<VirtualCard | null>(null);
  const [blockReason, setBlockReason] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cardsData, isLoading } = useQuery<VirtualCardsResponse>({
    queryKey: ["/api/admin/virtual-cards", { search }],
    queryFn: async () => {
      const params = new URLSearchParams({ ...(search && { search }) });
      const response = await apiRequest("GET", `/api/admin/virtual-cards?${params}`);
      return response.json();
    },
  });

  const cards: VirtualCard[] = (cardsData as any)?.cards || [];

  const updateCardMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<VirtualCard> & { blockReason?: string | null } }) => {
      const response = await apiRequest("PUT", `/api/admin/virtual-cards/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/virtual-cards"] });
      toast({ title: "Card Updated", description: "Virtual card has been updated successfully" });
      setViewDialogCard(null);
      setSelectedCard(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update virtual card", variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 text-white">Active</Badge>;
      case "frozen":
        return <Badge variant="destructive" className="bg-orange-500 text-white">Frozen</Badge>;
      case "blocked":
        return <Badge variant="destructive" className="bg-red-600 text-white">Blocked</Badge>;
      case "expired":
        return <Badge variant="secondary">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const maskCardNumber = (num: string) => `****-****-****-${num.slice(-4)}`;

  const handleUnfreeze = (card: VirtualCard) => {
    updateCardMutation.mutate({ id: card.id, updates: { status: "active", freezeReason: null } });
  };

  const handleReissueCard = async (card: VirtualCard) => {
    try {
      const response = await apiRequest("POST", `/api/admin/virtual-cards/${card.id}/reissue`, {});
      if (response.ok) {
        toast({ title: "Card Reissued", description: "A new card has been issued to the user" });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/virtual-cards"] });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to reissue card", variant: "destructive" });
    }
  };

  const handleConfirmFreeze = () => {
    if (!freezeDialogCard) return;
    updateCardMutation.mutate({
      id: freezeDialogCard.id,
      updates: { status: "frozen", freezeReason: freezeReason.trim() || "Frozen by administrator" },
    });
    setFreezeDialogCard(null);
    setFreezeReason("");
  };

  const handleConfirmBlock = () => {
    if (!blockDialogCard) return;
    if (!blockReason.trim()) {
      toast({ title: "Reason Required", description: "Please provide a reason for blocking this card.", variant: "destructive" });
      return;
    }
    updateCardMutation.mutate({
      id: blockDialogCard.id,
      updates: { status: "blocked", blockReason: blockReason.trim() },
    });
    setBlockDialogCard(null);
    setBlockReason("");
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const activeCards = cards.filter((c) => c.status === "active").length;
  const frozenCards = cards.filter((c) => c.status === "frozen").length;
  const blockedCards = cards.filter((c) => c.status === "blocked").length;
  const totalBalance = cards.reduce((sum, c) => sum + parseFloat(c.balance || "0"), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Virtual Card Management
          </CardTitle>
          <CardDescription>Monitor and manage virtual cards across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by card number, name, email, phone, or user ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              data-testid="input-card-search"
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <CreditCard className="w-4 h-4 text-blue-600" />, label: "Total Cards", value: cards.length },
          { icon: <Unlock className="w-4 h-4 text-green-600" />, label: "Active", value: activeCards },
          { icon: <Lock className="w-4 h-4 text-orange-500" />, label: "Frozen", value: frozenCards },
          { icon: <ShieldOff className="w-4 h-4 text-red-600" />, label: "Blocked", value: blockedCards },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              {s.icon}
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cards Table */}
      <Card>
        <CardHeader>
          <CardTitle>Virtual Cards ({cards.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Card</TableHead>
                <TableHead>Cardholder / User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cards.map((card) => (
                <TableRow key={card.id}>
                  <TableCell>
                    <p className="font-mono text-sm font-medium">{maskCardNumber(card.cardNumber)}</p>
                    <p className="text-xs text-muted-foreground">Exp: {card.expiryDate}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-sm">{card.cardHolderName}</p>
                    {card.userName && card.userName !== card.cardHolderName && (
                      <p className="text-xs text-primary font-medium">{card.userName}</p>
                    )}
                    {card.userEmail && (
                      <p className="text-xs text-muted-foreground truncate max-w-[160px]">{card.userEmail}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(card.status)}
                    {card.status === "frozen" && card.freezeReason && (
                      <p className="text-xs text-orange-500 mt-1 max-w-[140px] truncate">{card.freezeReason}</p>
                    )}
                    {card.status === "blocked" && card.blockReason && (
                      <p className="text-xs text-red-500 mt-1 max-w-[140px] truncate">{card.blockReason}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">${parseFloat(card.balance).toFixed(2)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{format(new Date(card.purchaseDate), "MMM dd, yyyy")}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setViewDialogCard(card); setShowCvv(false); }}
                        data-testid={`button-view-card-${card.id}`}
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      {card.status === "active" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setFreezeReason(""); setFreezeDialogCard(card); }}
                            title="Freeze Card"
                            className="text-orange-500 hover:text-orange-600"
                            data-testid={`button-freeze-card-${card.id}`}
                          >
                            <Lock className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setBlockReason(""); setBlockDialogCard(card); }}
                            title="Block Card (Permanent)"
                            className="text-red-600 hover:text-red-700"
                            data-testid={`button-block-card-${card.id}`}
                          >
                            <ShieldOff className="w-4 h-4" />
                          </Button>
                        </>
                      )}

                      {card.status === "frozen" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnfreeze(card)}
                            disabled={updateCardMutation.isPending}
                            title="Unfreeze Card"
                            className="text-green-600 hover:text-green-700"
                            data-testid={`button-unfreeze-card-${card.id}`}
                          >
                            <Unlock className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReissueCard(card)}
                            disabled={updateCardMutation.isPending}
                            title="Reissue Card"
                            className="text-blue-600 hover:text-blue-700"
                            data-testid={`button-reissue-card-frozen-${card.id}`}
                          >
                            <CreditCard className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setBlockReason(""); setBlockDialogCard(card); }}
                            title="Block Card (Permanent)"
                            className="text-red-600 hover:text-red-700"
                            data-testid={`button-block-card-frozen-${card.id}`}
                          >
                            <ShieldOff className="w-4 h-4" />
                          </Button>
                        </>
                      )}

                      {(card.status === "blocked" || card.status === "inactive") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReissueCard(card)}
                          disabled={updateCardMutation.isPending}
                          title="Reissue Card for User"
                          className="text-blue-600 hover:text-blue-700"
                          data-testid={`button-reissue-card-${card.id}`}
                        >
                          <CreditCard className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {cards.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No virtual cards found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Card Dialog */}
      <Dialog open={!!viewDialogCard} onOpenChange={(open) => { if (!open) { setViewDialogCard(null); setShowCvv(false); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Virtual Card Details</DialogTitle>
            <DialogDescription>Full card information and controls</DialogDescription>
          </DialogHeader>
          {viewDialogCard && (
            <div className="space-y-6">
              {/* Card Visual */}
              <div className="bg-gradient-to-br from-green-600 to-emerald-800 rounded-2xl p-5 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-12 translate-x-12" />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-green-200 text-xs font-medium">GreenPay Card</p>
                      <p className="text-white/60 text-xs">Virtual</p>
                    </div>
                    <div className="flex gap-1.5">
                      <div className="w-8 h-5 rounded bg-white/25" />
                      <div className="w-5 h-5 rounded-full bg-white/40" />
                    </div>
                  </div>
                  <p className="font-mono text-lg tracking-widest mb-5">
                    {showCvv ? viewDialogCard.cardNumber.replace(/(.{4})/g, "$1 ").trim() : `•••• •••• •••• ${viewDialogCard.cardNumber.slice(-4)}`}
                  </p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-green-200 text-[10px] uppercase tracking-wide mb-0.5">Cardholder</p>
                      <p className="text-sm font-semibold">{viewDialogCard.cardHolderName}</p>
                    </div>
                    <div>
                      <p className="text-green-200 text-[10px] uppercase tracking-wide mb-0.5">Expires</p>
                      <p className="text-sm font-semibold">{viewDialogCard.expiryDate}</p>
                    </div>
                    <div>
                      <p className="text-green-200 text-[10px] uppercase tracking-wide mb-0.5">CVV</p>
                      <p className="text-sm font-semibold">{showCvv ? viewDialogCard.cvv : "•••"}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowCvv(!showCvv)}
                  className="absolute top-3 right-3 bg-white/20 hover:bg-white/30 rounded-full p-1.5 transition-colors"
                  title={showCvv ? "Hide details" : "Show details"}
                >
                  {showCvv ? <EyeOff className="w-4 h-4 text-white" /> : <Eye className="w-4 h-4 text-white" />}
                </button>
              </div>

              {/* Status + Balance */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  {getStatusBadge(viewDialogCard.status)}
                  {viewDialogCard.status === "frozen" && viewDialogCard.freezeReason && (
                    <p className="text-xs text-orange-600 mt-2 italic">{viewDialogCard.freezeReason}</p>
                  )}
                  {viewDialogCard.status === "blocked" && viewDialogCard.blockReason && (
                    <p className="text-xs text-red-600 mt-2 italic">{viewDialogCard.blockReason}</p>
                  )}
                </div>
                <div className="p-4 bg-muted rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">Balance</p>
                  <p className="text-xl font-bold text-green-600">${parseFloat(viewDialogCard.balance).toFixed(2)}</p>
                </div>
              </div>

              {/* Meta info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex gap-2 items-start">
                  <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-muted-foreground text-xs">Purchase Date</p>
                    <p className="font-medium">{format(new Date(viewDialogCard.purchaseDate), "MMM dd, yyyy HH:mm")}</p>
                  </div>
                </div>
                <div className="flex gap-2 items-start">
                  <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-muted-foreground text-xs">Account Owner</p>
                    {viewDialogCard.userName && <p className="text-sm font-medium">{viewDialogCard.userName}</p>}
                    {viewDialogCard.userEmail && <p className="text-xs text-muted-foreground">{viewDialogCard.userEmail}</p>}
                    {viewDialogCard.userPhone && <p className="text-xs text-muted-foreground">{viewDialogCard.userPhone}</p>}
                    <p className="font-mono text-xs text-muted-foreground mt-1">{viewDialogCard.userId}</p>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="border-t pt-4">
                <p className="text-sm font-semibold mb-3">Card Actions</p>
                <div className="flex flex-wrap gap-2">
                  {viewDialogCard.status === "active" && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => { setViewDialogCard(null); setFreezeReason(""); setFreezeDialogCard(viewDialogCard); }}
                        className="text-orange-600 border-orange-300 hover:bg-orange-50"
                      >
                        <Lock className="w-4 h-4 mr-2" /> Freeze Card
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => { setViewDialogCard(null); setBlockReason(""); setBlockDialogCard(viewDialogCard); }}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <ShieldOff className="w-4 h-4 mr-2" /> Block Card
                      </Button>
                    </>
                  )}
                  {viewDialogCard.status === "frozen" && (
                    <>
                      <Button
                        onClick={() => handleUnfreeze(viewDialogCard)}
                        disabled={updateCardMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Unlock className="w-4 h-4 mr-2" /> Unfreeze Card
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => { setViewDialogCard(null); setBlockReason(""); setBlockDialogCard(viewDialogCard); }}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <ShieldOff className="w-4 h-4 mr-2" /> Block Card
                      </Button>
                    </>
                  )}
                  {(viewDialogCard.status === "expired" || viewDialogCard.status === "blocked") && (
                    <p className="text-sm text-muted-foreground">No actions available for {viewDialogCard.status} cards.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Freeze Dialog */}
      <Dialog open={!!freezeDialogCard} onOpenChange={(open) => { if (!open) setFreezeDialogCard(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-orange-500" /> Freeze Card
            </DialogTitle>
            <DialogDescription>
              Freezing temporarily disables the card. The cardholder cannot transact until unfrozen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {freezeDialogCard && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <span className="text-muted-foreground">Card: </span>
                <span className="font-mono font-medium">{maskCardNumber(freezeDialogCard.cardNumber)}</span>
                <span className="ml-3 text-muted-foreground">Holder: </span>
                <span className="font-medium">{freezeDialogCard.cardHolderName}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label>Reason for freezing</Label>
              <Textarea
                placeholder="e.g. Suspicious activity, pending compliance review..."
                value={freezeReason}
                onChange={(e) => setFreezeReason(e.target.value)}
                rows={3}
                data-testid="input-freeze-reason"
              />
              <p className="text-xs text-muted-foreground">If blank, "Frozen by administrator" will be shown to the user.</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setFreezeDialogCard(null)}>Cancel</Button>
              <Button
                className="bg-orange-500 hover:bg-orange-600 text-white"
                onClick={handleConfirmFreeze}
                disabled={updateCardMutation.isPending}
                data-testid="button-confirm-freeze"
              >
                <Lock className="w-4 h-4 mr-2" /> Freeze Card
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Block Dialog */}
      <Dialog open={!!blockDialogCard} onOpenChange={(open) => { if (!open) setBlockDialogCard(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <ShieldOff className="w-5 h-5" /> Block Card (Permanent)
            </DialogTitle>
            <DialogDescription>
              Blocking permanently disables the card. The user will need to purchase a new card. A reason is <strong>required</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {blockDialogCard && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800 text-sm">
                <span className="text-muted-foreground">Card: </span>
                <span className="font-mono font-medium">{maskCardNumber(blockDialogCard.cardNumber)}</span>
                <span className="ml-3 text-muted-foreground">Holder: </span>
                <span className="font-medium">{blockDialogCard.cardHolderName}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label>
                Reason for blocking <span className="text-red-500">*</span>
              </Label>
              <Textarea
                placeholder="e.g. Fraudulent activity detected, card compromised, policy violation..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                rows={3}
                data-testid="input-block-reason"
              />
              <p className="text-xs text-red-500">This reason will be shown to the cardholder. Required field.</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setBlockDialogCard(null)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={handleConfirmBlock}
                disabled={updateCardMutation.isPending || !blockReason.trim()}
                data-testid="button-confirm-block"
              >
                <ShieldOff className="w-4 h-4 mr-2" /> Block Card
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
