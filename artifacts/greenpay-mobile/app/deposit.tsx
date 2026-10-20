import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth";
import colors from "@/constants/colors";

type Wallet = { id: string; currency: string; isDefault?: boolean };
type Config = { isKenya?: boolean; countryPaymentCurrency?: string; methods?: Record<string,string>; paymentReadiness?: { mobileMoney?: boolean; card?: boolean }; manualMpesa?: { enabled: boolean; paybill?: string; account?: string } };
const on = (v?: string) => String(v || "").replace(/['"]/g,"").toLowerCase() === "true";

export default function DepositScreen() {
  const { user } = useAuth(); const router = useRouter();
  const queryClient = useQueryClient();
  const [amount,setAmount]=useState(""); const [phone,setPhone]=useState(""); const [reference,setReference]=useState(""); const [busy,setBusy]=useState(false); const [message,setMessage]=useState("");
  const config=useQuery({queryKey:["deposit-config",user?.id],queryFn:()=>api<Config>("/api/deposit/config"),enabled:!!user});
  const wallets=useQuery({queryKey:["mobile-wallets",user?.id],queryFn:()=>api<{wallets:Wallet[]}>("/api/wallets"),enabled:!!user});
  const wallet=wallets.data?.wallets?.find(w=>w.isDefault)||wallets.data?.wallets?.[0];
  if (!user) return <Redirect href="/sign-in"/>;
  const cfg=config.data;
  const mobile=on(cfg?.methods?.global_enabled)&&cfg?.isKenya&&on(cfg?.methods?.mpesa_enabled)&&cfg?.paymentReadiness?.mobileMoney===true;
  // The existing card-deposit endpoint currently accepts Kenyan KES charges only.
  const card=on(cfg?.methods?.global_enabled)&&cfg?.isKenya===true&&cfg?.countryPaymentCurrency==="KES"&&on(cfg?.methods?.card_enabled)&&cfg?.paymentReadiness?.card===true;
  const manual=on(cfg?.methods?.global_enabled)&&cfg?.manualMpesa?.enabled===true&&wallet?.currency==="KES";
  const start=async(method:"mobile_money"|"card"|"manual")=>{
    if(!wallet||!Number(amount)||Number(amount)<=0){setMessage("Choose a wallet and enter a valid amount.");return}
    setBusy(true);setMessage("");
    try{
      if(method==="manual"){
        const r=await api<{success:boolean;transactionReference?:string;message?:string}>("/api/deposit/manual-mpesa",{method:"POST",body:JSON.stringify({walletId:wallet.id,amount,paymentReference:reference})});
        setMessage(`Deposit submitted and remains pending verification. Reference: ${r.transactionReference||"submitted"}`);
      }else if(method==="mobile_money"){
        const r=await api<{redirectUrl?:string;message?:string;reference?:string}>("/api/deposit/nexuspay",{method:"POST",body:JSON.stringify({walletId:wallet.id,currency:wallet.currency,paymentCurrency:cfg?.countryPaymentCurrency,paymentMethod:"mobile_money",amount,phone,email:user.email})});
        if(r.redirectUrl) { await WebBrowser.openBrowserAsync(r.redirectUrl); await queryClient.invalidateQueries(); } else setMessage(r.message||"Check your phone for the payment prompt.");
      }else{
        const r=await api<{authorizationUrl?:string}>("/api/deposit/paystack",{method:"POST",body:JSON.stringify({walletId:wallet.id,amount,currency:wallet.currency,paymentCurrency:cfg?.countryPaymentCurrency})});
        if(r.authorizationUrl) { await WebBrowser.openBrowserAsync(r.authorizationUrl); await queryClient.invalidateQueries(); } else setMessage("Secure checkout was not returned. Contact support before retrying.");
      }
    }catch(e){setMessage(e instanceof Error?e.message:"Deposit could not be started.");}finally{setBusy(false)}
  };
  return <SafeAreaView style={s.safe} edges={["top"]}><View style={s.page}><Pressable onPress={()=>router.back()}><Text style={s.back}>‹  Back</Text></Pressable><Text style={s.title}>Add money</Text><Text style={s.sub}>Methods are shown only when enabled for your profile country and account.</Text>
    {(config.isLoading||wallets.isLoading)&&<ActivityIndicator color={colors.light.primary}/>}
    {!config.isLoading&&!wallet&&<Text style={s.error}>No wallet is available. Refresh and try again.</Text>}
    <Text style={s.label}>Amount to deposit ({wallet?.currency||"wallet currency"}; card checkout is charged in KES)</Text><TextInput style={s.input} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} placeholder="0.00"/>
    {mobile&&<><Text style={s.label}>M-Pesa phone number</Text><TextInput style={s.input} keyboardType="phone-pad" value={phone} onChangeText={setPhone} placeholder="+254..."/><Button label="Pay with M-Pesa" disabled={busy||!wallet} onPress={()=>void start("mobile_money")}/></>}
    {card&&<Button label="Pay by card" disabled={busy||!wallet} onPress={()=>void start("card")}/>}
    {manual&&<View style={s.info}><Text style={s.label}>Manual M-Pesa · pending until verified</Text><Text>Paybill: {cfg?.manualMpesa?.paybill}  Account: {cfg?.manualMpesa?.account}</Text><TextInput style={s.input} value={reference} onChangeText={setReference} placeholder="Payment reference"/><Button label="Submit for verification" disabled={busy||!reference||!wallet} onPress={()=>void start("manual")}/></View>}
    {config.isError&&<Text style={s.error}>Deposit options could not load. Retry from the home screen.</Text>}
    {cfg&&!mobile&&!card&&!manual&&<Text style={s.infoText}>No deposit methods are currently enabled for your account.</Text>}
    {!!message&&<Text accessibilityRole="alert" style={s.infoText}>{message}</Text>}{busy&&<ActivityIndicator color={colors.light.primary}/>}
  </View></SafeAreaView>
}
function Button({label,disabled,onPress}:{label:string;disabled:boolean;onPress:()=>void}){return <Pressable disabled={disabled} onPress={onPress} style={[s.button,disabled&&{opacity:.5}]}><Text style={s.buttonText}>{label}</Text></Pressable>}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:colors.light.background},page:{padding:20,gap:12},back:{color:colors.light.primary,fontWeight:"600"},title:{fontSize:27,fontWeight:"700",color:colors.light.foreground},sub:{fontSize:13,color:colors.light.mutedForeground,lineHeight:19,marginBottom:6},label:{fontSize:13,fontWeight:"600",color:colors.light.foreground},input:{height:50,borderWidth:1,borderColor:colors.light.border,borderRadius:13,backgroundColor:colors.light.card,paddingHorizontal:14,color:colors.light.foreground},button:{height:50,backgroundColor:colors.light.primary,borderRadius:14,alignItems:"center",justifyContent:"center",marginBottom:5},buttonText:{color:colors.light.primaryForeground,fontWeight:"700"},info:{gap:10,backgroundColor:colors.light.card,borderWidth:1,borderColor:colors.light.border,borderRadius:15,padding:14},infoText:{fontSize:13,color:colors.light.mutedForeground,lineHeight:19},error:{color:colors.light.destructive,fontSize:13}});
